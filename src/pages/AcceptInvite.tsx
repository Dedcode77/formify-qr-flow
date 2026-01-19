import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'needsAuth'>('loading');
  const [message, setMessage] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setStatus('error');
      setMessage('Lien d\'invitation invalide');
      return;
    }

    if (!user) {
      setStatus('needsAuth');
      setMessage('Veuillez vous connecter pour accepter l\'invitation');
      return;
    }

    acceptInvitation();
  }, [token, user, authLoading]);

  const acceptInvitation = async () => {
    if (!token) return;

    setStatus('loading');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('accept-invitation', {
        body: { token },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de l\'acceptation');
      }

      const data = response.data;

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setOrganizationId(data.organizationId);
        toast.success(data.message);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage(error.message || 'Erreur lors de l\'acceptation de l\'invitation');
      toast.error(error.message || 'Erreur lors de l\'acceptation');
    }
  };

  const handleLoginRedirect = () => {
    // Store the current URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    navigate('/auth');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Vérification...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Traitement de l\'invitation...'}
            {status === 'success' && 'Invitation acceptée !'}
            {status === 'error' && 'Erreur'}
            {status === 'needsAuth' && 'Connexion requise'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <Button onClick={handleGoToDashboard} className="w-full">
                  Aller au tableau de bord
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                    Accueil
                  </Button>
                  <Button onClick={() => navigate('/dashboard')} className="flex-1">
                    Dashboard
                  </Button>
                </div>
              </>
            )}

            {status === 'needsAuth' && (
              <>
                <LogIn className="h-12 w-12 text-primary" />
                <Button onClick={handleLoginRedirect} className="w-full gap-2">
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
