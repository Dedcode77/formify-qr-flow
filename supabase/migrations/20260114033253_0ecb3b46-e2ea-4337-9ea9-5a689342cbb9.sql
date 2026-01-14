-- Add webhook and confirmation email settings to forms table
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS webhook_url text,
ADD COLUMN IF NOT EXISTS confirmation_email_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmation_email_subject text DEFAULT 'Merci pour votre réponse',
ADD COLUMN IF NOT EXISTS confirmation_email_body text DEFAULT 'Nous avons bien reçu votre réponse. Merci de nous avoir contactés !';