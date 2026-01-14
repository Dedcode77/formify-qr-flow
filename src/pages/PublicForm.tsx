import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FormField } from '@/types/form';
import { Json } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, FileText } from 'lucide-react';

interface FormData {
  id: string;
  name: string;
  description: string | null;
  fields: FormField[];
  is_published: boolean;
  webhook_url?: string | null;
  confirmation_email_enabled?: boolean;
  confirmation_email_subject?: string | null;
  confirmation_email_body?: string | null;
}

export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const signatureRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [slug]);

  const fetchForm = async () => {
    if (!slug) return;

    const { data, error } = await supabase
      .from('forms')
      .select('id, name, description, fields, is_published, webhook_url, confirmation_email_enabled, confirmation_email_subject, confirmation_email_body')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching form:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le formulaire",
        variant: "destructive"
      });
    } else if (data) {
      const fields = Array.isArray(data.fields) 
        ? (data.fields as unknown as FormField[])
        : [];
      setForm({ ...data, fields });
    }

    setLoading(false);
  };

  const handleInputChange = (fieldId: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, optionValue: string, checked: boolean) => {
    setFormValues(prev => {
      const current = (prev[fieldId] as string[]) || [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, optionValue] };
      } else {
        return { ...prev, [fieldId]: current.filter(v => v !== optionValue) };
      }
    });
  };

  // Signature drawing functions
  const startDrawing = (fieldId: string, e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureRefs.current[fieldId];
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (fieldId: string, e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureRefs.current[fieldId];
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = (fieldId: string) => {
    setIsDrawing(false);
    const canvas = signatureRefs.current[fieldId];
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      handleInputChange(fieldId, dataUrl);
    }
  };

  const clearSignature = (fieldId: string) => {
    const canvas = signatureRefs.current[fieldId];
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleInputChange(fieldId, '');
  };

  const validateForm = (): boolean => {
    if (!form) return false;

    for (const field of form.fields) {
      if (field.required) {
        const value = formValues[field.id];
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          toast({
            title: "Champ requis",
            description: `Le champ "${field.label}" est obligatoire`,
            variant: "destructive"
          });
          return false;
        }
      }

      // Email validation
      if (field.type === 'email' && formValues[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formValues[field.id] as string)) {
          toast({
            title: "Email invalide",
            description: "Veuillez entrer une adresse email valide",
            variant: "destructive"
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form || !validateForm()) return;

    setSubmitting(true);

    try {
      // Insert response
      const { error } = await supabase
        .from('form_responses')
        .insert([{
          form_id: form.id,
          data: formValues as unknown as Json
        }]);

      if (error) throw error;

      // Build response data with field labels
      const responseWithLabels: Record<string, unknown> = {};
      form.fields.forEach(field => {
        responseWithLabels[field.label] = formValues[field.id];
      });

      // Send webhook notification if configured
      if (form.webhook_url) {
        try {
          await fetch(form.webhook_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            mode: "no-cors",
            body: JSON.stringify({
              form_id: form.id,
              form_name: form.name,
              submitted_at: new Date().toISOString(),
              data: responseWithLabels,
            }),
          });
          console.log("Webhook sent successfully");
        } catch (webhookError) {
          console.error("Webhook error:", webhookError);
        }
      }

      // Send confirmation email to respondent if enabled
      if (form.confirmation_email_enabled) {
        const emailField = form.fields.find(f => f.type === 'email');
        if (emailField && formValues[emailField.id]) {
          try {
            await supabase.functions.invoke('send-confirmation-email', {
              body: {
                toEmail: formValues[emailField.id],
                formName: form.name,
                subject: form.confirmation_email_subject || 'Merci pour votre réponse',
                body: form.confirmation_email_body || 'Nous avons bien reçu votre réponse.'
              }
            });
            console.log("Confirmation email sent");
          } catch (emailError) {
            console.error("Confirmation email error:", emailError);
          }
        }
      }

      // Send owner notification email
      const { data: formData } = await supabase
        .from('forms')
        .select('organization_id')
        .eq('id', form.id)
        .single();

      if (formData?.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('owner_id')
          .eq('id', formData.organization_id)
          .single();

        if (orgData?.owner_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', orgData.owner_id)
            .single();

          if (profileData?.email) {
            await supabase.functions.invoke('send-form-notification', {
              body: {
                formId: form.id,
                formName: form.name,
                responseData: responseWithLabels,
                ownerEmail: profileData.email
              }
            });
          }
        }
      }

      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le formulaire",
        variant: "destructive"
      });
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Formulaire introuvable</CardTitle>
            <CardDescription>
              Ce formulaire n'existe pas ou n'est pas publié.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} variant="outline">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Merci !</CardTitle>
            <CardDescription>
              Votre réponse a été enregistrée avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline">
              Soumettre une autre réponse
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{form.name}</CardTitle>
            {form.description && (
              <CardDescription className="text-base">{form.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>

                  {field.type === 'text' && (
                    <Input 
                      placeholder={field.placeholder}
                      value={(formValues[field.id] as string) || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'email' && (
                    <Input 
                      type="email"
                      placeholder={field.placeholder || 'email@exemple.com'}
                      value={(formValues[field.id] as string) || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'phone' && (
                    <Input 
                      type="tel"
                      placeholder={field.placeholder || '+33 6 00 00 00 00'}
                      value={(formValues[field.id] as string) || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'number' && (
                    <Input 
                      type="number"
                      placeholder={field.placeholder}
                      value={(formValues[field.id] as string) || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <Textarea 
                      placeholder={field.placeholder}
                      rows={4}
                      value={(formValues[field.id] as string) || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'date' && (
                    <Input 
                      type="date"
                      value={(formValues[field.id] as string) || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'time' && (
                    <Input 
                      type="time"
                      value={(formValues[field.id] as string) || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'select' && (
                    <Select
                      value={(formValues[field.id] as string) || ''}
                      onValueChange={(value) => handleInputChange(field.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || 'Sélectionner...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.id} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="space-y-2">
                      {field.options?.map((option) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <Checkbox 
                            id={option.id}
                            checked={((formValues[field.id] as string[]) || []).includes(option.value)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(field.id, option.value, checked as boolean)
                            }
                          />
                          <Label htmlFor={option.id} className="font-normal cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {field.type === 'radio' && (
                    <RadioGroup
                      value={(formValues[field.id] as string) || ''}
                      onValueChange={(value) => handleInputChange(field.id, value)}
                    >
                      {field.options?.map((option) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <RadioGroupItem value={option.value} id={option.id} />
                          <Label htmlFor={option.id} className="font-normal cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {field.type === 'signature' && (
                    <div className="space-y-2">
                      <canvas
                        ref={(el) => { signatureRefs.current[field.id] = el; }}
                        width={400}
                        height={150}
                        className="border-2 border-dashed rounded-lg bg-white cursor-crosshair w-full touch-none"
                        onMouseDown={(e) => startDrawing(field.id, e)}
                        onMouseMove={(e) => draw(field.id, e)}
                        onMouseUp={() => stopDrawing(field.id)}
                        onMouseLeave={() => stopDrawing(field.id)}
                        onTouchStart={(e) => startDrawing(field.id, e)}
                        onTouchMove={(e) => draw(field.id, e)}
                        onTouchEnd={() => stopDrawing(field.id)}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => clearSignature(field.id)}
                      >
                        Effacer la signature
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Propulsé par <span className="font-medium text-primary">FormFlow</span>
        </p>
      </div>
    </div>
  );
}
