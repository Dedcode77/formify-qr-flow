import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  FileText, 
  ExternalLink, 
  Copy, 
  Trash2,
  Edit
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockForms = [
  {
    id: '1',
    name: 'Formulaire de satisfaction',
    slug: 'satisfaction-client',
    responses: 127,
    createdAt: '2024-01-15',
    isPublished: true,
  },
  {
    id: '2',
    name: 'Inscription événement',
    slug: 'inscription-evenement',
    responses: 45,
    createdAt: '2024-01-10',
    isPublished: true,
  },
  {
    id: '3',
    name: 'Feedback produit',
    slug: 'feedback-produit',
    responses: 89,
    createdAt: '2024-01-05',
    isPublished: false,
  },
  {
    id: '4',
    name: 'Demande de contact',
    slug: 'contact',
    responses: 234,
    createdAt: '2024-01-01',
    isPublished: true,
  },
];

export default function FormsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredForms = mockForms.filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(`https://formy.app/f/${slug}`);
    toast({
      title: 'Lien copié',
      description: 'Le lien du formulaire a été copié dans le presse-papier.',
    });
  };

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
                        Créé le {new Date(form.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/forms/${form.id}`} className="flex items-center">
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyLink(form.slug)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copier le lien
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ouvrir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-2xl font-bold">{form.responses}</p>
                        <p className="text-xs text-muted-foreground">réponses</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      form.isPublished 
                        ? 'bg-success/10 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {form.isPublished ? 'Publié' : 'Brouillon'}
                    </span>
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
    </DashboardLayout>
  );
}
