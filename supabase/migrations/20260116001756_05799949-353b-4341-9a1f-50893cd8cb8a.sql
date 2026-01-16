-- Create validation trigger function for form responses
CREATE OR REPLACE FUNCTION public.validate_form_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  form_record RECORD;
  form_field_ids TEXT[];
  response_keys TEXT[];
  key TEXT;
BEGIN
  -- Validate data is a JSON object
  IF jsonb_typeof(NEW.data) != 'object' THEN
    RAISE EXCEPTION 'Form response data must be a JSON object';
  END IF;
  
  -- Validate data size (max 1MB)
  IF pg_column_size(NEW.data) > 1048576 THEN
    RAISE EXCEPTION 'Form response data exceeds maximum size limit (1MB)';
  END IF;
  
  -- Validate form exists and is published
  SELECT id, fields INTO form_record
  FROM public.forms
  WHERE id = NEW.form_id AND is_published = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Form not found or not published';
  END IF;
  
  -- Extract field IDs from form definition
  SELECT ARRAY(
    SELECT jsonb_array_elements(form_record.fields)->>'id'
  ) INTO form_field_ids;
  
  -- Extract keys from submitted response
  SELECT ARRAY(SELECT jsonb_object_keys(NEW.data)) INTO response_keys;
  
  -- Validate that response keys match form field IDs (no extra fields allowed)
  FOREACH key IN ARRAY response_keys
  LOOP
    IF NOT (key = ANY(form_field_ids)) THEN
      RAISE EXCEPTION 'Invalid field in response: %', key;
    END IF;
  END LOOP;
  
  -- Validate individual field values don't exceed reasonable size (64KB per field)
  FOR key IN SELECT jsonb_object_keys(NEW.data)
  LOOP
    IF pg_column_size(NEW.data->key) > 65536 THEN
      RAISE EXCEPTION 'Field value exceeds maximum size limit (64KB): %', key;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate form responses before insert
DROP TRIGGER IF EXISTS validate_response_before_insert ON public.form_responses;
CREATE TRIGGER validate_response_before_insert
  BEFORE INSERT ON public.form_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_form_response();