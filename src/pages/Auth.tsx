import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { useAuthStore, loginWithDemo } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuthStore();
  
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Demo login
    loginWithDemo();
    
    toast({
      title: mode === 'login' ? 'Connexion réussie !' : 'Compte créé !',
      description: 'Bienvenue sur Formy.',
    });

    setIsLoading(false);
    navigate('/dashboard');
  };

  const handleDemoLogin = () => {
    loginWithDemo();
    toast({
      title: 'Connexion démo',
      description: 'Vous êtes connecté avec le compte de démonstration.',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Formy</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === 'login' 
              ? 'Accédez à votre tableau de bord' 
              : 'Commencez à créer des formulaires gratuitement'
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre nom"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            size="lg"
            onClick={handleDemoLogin}
          >
            Essayer avec un compte démo
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline font-medium"
                >
                  S'inscrire
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline font-medium"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
        </div>
        
        <div className="relative z-10 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Créez des formulaires puissants
          </h2>
          <p className="text-lg opacity-90 max-w-md">
            Drag & drop intuitif, gestion de présence par QR code, et analytics en temps réel.
          </p>
        </div>
      </div>
    </div>
  );
}
