import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Webhook, Mail, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FormSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    id: string;
    name: string;
    webhook_url?: string | null;
    confirmation_email_enabled?: boolean;
    confirmation_email_subject?: string | null;
    confirmation_email_body?: string | null;
  };
}

export function FormSettingsDialog({ open, onOpenChange, form }: FormSettingsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [webhookUrl, setWebhookUrl] = useState(form.webhook_url || '');
  const [emailEnabled, setEmailEnabled] = useState(form.confirmation_email_enabled || false);
  const [emailSubject, setEmailSubject] = useState(form.confirmation_email_subject || 'Merci pour votre réponse');
  const [emailBody, setEmailBody] = useState(form.confirmation_email_body || 'Nous avons bien reçu votre réponse. Merci de nous avoir contactés !');

  useEffect(() => {
    setWebhookUrl(form.webhook_url || '');
    setEmailEnabled(form.confirmation_email_enabled || false);
    setEmailSubject(form.confirmation_email_subject || 'Merci pour votre réponse');
    setEmailBody(form.confirmation_email_body || 'Nous avons bien reçu votre réponse. Merci de nous avoir contactés !');
  }, [form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('forms')
        .update({
          webhook_url: webhookUrl || null,
          confirmation_email_enabled: emailEnabled,
          confirmation_email_subject: emailSubject,
          confirmation_email_body: emailBody,
        })
        .eq('id', form.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast({
        title: 'Paramètres sauvegardés',
        description: 'Les paramètres du formulaire ont été mis à jour.',
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paramètres - {form.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="webhook" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="webhook" className="gap-2">
              <Webhook className="w-4 h-4" />
              Webhook
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="webhook" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Webhook de notification</CardTitle>
                <CardDescription>
                  Recevez une notification sur Zapier, Make ou tout autre service lorsqu'une nouvelle réponse est soumise.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL du Webhook</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>

                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Comment configurer
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Créez un Zap sur <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Zapier</a> ou un scénario sur <a href="https://make.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Make</a></li>
                    <li>Ajoutez un déclencheur "Webhook"</li>
                    <li>Copiez l'URL du webhook ici</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Email de confirmation</CardTitle>
                <CardDescription>
                  Envoyez un email automatique aux répondants après la soumission du formulaire.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-enabled">Activer l'email de confirmation</Label>
                  <Switch
                    id="email-enabled"
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                  />
                </div>

                {emailEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email-subject">Sujet de l'email</Label>
                      <Input
                        id="email-subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-body">Corps de l'email</Label>
                      <Textarea
                        id="email-body"
                        rows={4}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Votre message de confirmation..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Astuce : Le nom du répondant sera automatiquement ajouté si un champ email est présent.
                      </p>
                    </div>
                  </>
                )}

                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Important
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pour envoyer des emails de confirmation, votre formulaire doit contenir un champ de type "Email".
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="hero" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
