import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  FileText, 
  ExternalLink, 
  Copy, 
  Trash2,
  Edit,
  Loader2,
  BarChart3,
  Link2,
  QrCode,
  Files,
  Settings
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { FormSettingsDialog } from '@/components/forms/FormSettingsDialog';

export default function FormsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<{ id: string; name: string; slug: string; webhook_url?: string | null; confirmation_email_enabled?: boolean; confirmation_email_subject?: string | null; confirmation_email_body?: string | null } | null>(null);
  const { toast } = useToast();
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: forms, isLoading } = useQuery({
    queryKey: ['forms', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('organization_id', organization.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (formId: string) => {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast({
        title: 'Formulaire supprimé',
        description: 'Le formulaire a été supprimé avec succès.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le formulaire.',
        variant: 'destructive',
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ formId, isPublished }: { formId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from('forms')
        .update({ is_published: isPublished })
        .eq('id', formId);
      if (error) throw error;
    },
    onSuccess: (_, { isPublished }) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast({
        title: isPublished ? 'Formulaire publié' : 'Formulaire dépublié',
        description: isPublished 
          ? 'Le formulaire est maintenant accessible au public.'
          : 'Le formulaire n\'est plus accessible au public.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut de publication.',
        variant: 'destructive',
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (form: typeof forms extends (infer T)[] | undefined ? T : never) => {
      if (!organization?.id || !user?.id) throw new Error('Missing org or user');
      
      const newSlug = `${form.slug}-copy-${Date.now().toString(36)}`;
      const { data, error } = await supabase
        .from('forms')
        .insert({
          name: `${form.name} (copie)`,
          description: form.description,
          slug: newSlug,
          fields: form.fields,
          is_published: false,
          organization_id: organization.id,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast({
        title: 'Formulaire dupliqué',
        description: 'Le formulaire a été dupliqué avec succès.',
      });
      navigate(`/dashboard/forms/${data.id}`);
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de dupliquer le formulaire.',
        variant: 'destructive',
      });
    },
  });

  const filteredForms = forms?.filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/f/${slug}`);
    toast({
      title: 'Lien copié',
      description: 'Le lien du formulaire a été copié dans le presse-papier.',
    });
  };

  const handleShowQR = (form: typeof forms extends (infer T)[] | undefined ? T : never) => {
    setSelectedForm(form);
    setQrDialogOpen(true);
  };

  const handleShowSettings = (form: typeof forms extends (infer T)[] | undefined ? T : never) => {
    setSelectedForm(form);
    setSettingsDialogOpen(true);
  };

  const downloadQRCode = () => {
    if (!selectedForm) return;
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${selectedForm.slug}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Formulaires</h1>
            <p className="text-muted-foreground mt-1">
              Gérez et créez vos formulaires
            </p>
          </div>
          <Link to="/dashboard/forms/new">
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Nouveau formulaire
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un formulaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Forms Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover-lift group">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{form.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Créé le {new Date(form.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/forms/${form.id}`} className="flex items-center">
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/forms/${form.id}/responses`} className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Voir les réponses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateMutation.mutate(form)}>
                        <Files className="w-4 h-4 mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleCopyLink(form.slug)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copier le lien
                      </DropdownMenuItem>
                      {form.is_published && (
                        <DropdownMenuItem onClick={() => handleShowQR(form)}>
                          <QrCode className="w-4 h-4 mr-2" />
                          Afficher QR Code
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleShowSettings(form)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/f/${form.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ouvrir
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteMutation.mutate(form.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  {/* QR Code & Copy Link Buttons */}
                  {form.is_published && (
                    <div className="flex gap-2 mb-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleCopyLink(form.slug)}
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        Copier le lien
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShowQR(form)}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShowSettings(form)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Settings button for unpublished forms */}
                  {!form.is_published && (
                    <div className="mb-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShowSettings(form)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-2xl font-bold">
                          {Array.isArray(form.fields) ? form.fields.length : 0}
                        </p>
                        <p className="text-xs text-muted-foreground">champs</p>
                      </div>
                    </div>
                    
                    {/* Publication Toggle */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={form.is_published}
                        onCheckedChange={(checked) => 
                          togglePublishMutation.mutate({ formId: form.id, isPublished: checked })
                        }
                        disabled={togglePublishMutation.isPending}
                      />
                      <span className={`text-xs font-medium ${
                        form.is_published 
                          ? 'text-success' 
                          : 'text-muted-foreground'
                      }`}>
                        {form.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Empty state */}
          {filteredForms.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucun formulaire trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Aucun résultat pour cette recherche' 
                  : 'Créez votre premier formulaire'}
              </p>
              {!searchQuery && (
                <Link to="/dashboard/forms/new">
                  <Button variant="hero">
                    <Plus className="w-4 h-4" />
                    Créer un formulaire
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedForm?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                id="qr-code-svg"
                value={`${window.location.origin}/f/${selectedForm?.slug}`}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scannez ce code pour accéder au formulaire
            </p>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleCopyLink(selectedForm?.slug || '')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copier le lien
              </Button>
              <Button 
                variant="hero" 
                className="flex-1"
                onClick={downloadQRCode}
              >
                Télécharger
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      {selectedForm && (
        <FormSettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          form={selectedForm}
        />
      )}
    </DashboardLayout>
  );
}
