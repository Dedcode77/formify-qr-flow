import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// TODO: Replace these with your actual Stripe price IDs
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    description: 'Pour découvrir Formy',
    features: [
      '3 formulaires',
      '50 réponses/mois',
      'Thèmes de base',
      'Export CSV',
      'QR Code',
    ],
    limits: { forms: 3, responses: 50 },
  },
  pro: {
    name: 'Pro',
    price: 19,
    priceId: 'price_PRO_REPLACE_ME', // Replace with actual Stripe price ID
    description: 'Pour les professionnels',
    popular: true,
    features: [
      'Formulaires illimités',
      '1 000 réponses/mois',
      'Analytics avancés',
      'Thèmes personnalisés',
      'Notifications email',
      'Webhooks',
      'Export Excel & PDF',
      'Support prioritaire',
    ],
    limits: { forms: -1, responses: 1000 },
  },
  business: {
    name: 'Business',
    price: 49,
    priceId: 'price_BUSINESS_REPLACE_ME', // Replace with actual Stripe price ID
    description: 'Pour les équipes',
    features: [
      'Tout du plan Pro',
      'Réponses illimitées',
      'Gestion d\'équipe',
      'Présence & pointage',
      'API complète',
      'SSO & sécurité avancée',
      'SLA garanti',
      'Support dédié 24/7',
    ],
    limits: { forms: -1, responses: -1 },
  },
} as const;

type PlanKey = keyof typeof PLANS;

interface SubscriptionState {
  subscribed: boolean;
  priceId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
}

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    priceId: null,
    subscriptionEnd: null,
    isLoading: false,
  });

  // Show toast on return from Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Abonnement activé avec succès !');
      checkSubscription();
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Paiement annulé.');
    }
  }, [searchParams]);

  // Check subscription status
  const checkSubscription = async () => {
    if (!isAuthenticated) return;
    setSubscription(prev => ({ ...prev, isLoading: true }));
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription({
        subscribed: data.subscribed,
        priceId: data.price_id,
        subscriptionEnd: data.subscription_end,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setSubscription(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      checkSubscription();
    }
  }, [isAuthenticated, authLoading]);

  const handleCheckout = async (priceId: string) => {
    if (!isAuthenticated) {
      navigate('/auth?mode=signup&redirect=/pricing');
      return;
    }

    setCheckoutLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Erreur lors de la création du paiement');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Portal error:', err);
      toast.error('Erreur lors de l\'ouverture du portail');
    }
  };

  const getCurrentPlan = (): PlanKey => {
    if (!subscription.subscribed) return 'free';
    for (const [key, plan] of Object.entries(PLANS)) {
      if (plan.priceId === subscription.priceId) return key as PlanKey;
    }
    return 'free';
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-padding">
        <div className="container-wide mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Tarification simple
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Choisissez le plan{' '}
              <span className="gradient-text">parfait pour vous</span>
            </h1>
            <p className="text-lg text-muted-foreground text-balance">
              Commencez gratuitement, évoluez quand vous êtes prêt. Tous les plans incluent un essai de 14 jours.
            </p>
          </motion.div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(
              ([key, plan], index) => {
                const isCurrentPlan = currentPlan === key;
                const isPopular = 'popular' in plan && plan.popular;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-2xl border p-8 flex flex-col ${
                      isPopular
                        ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                        : 'border-border'
                    } ${isCurrentPlan ? 'ring-2 ring-accent' : ''} bg-card`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Badge className="gradient-primary text-primary-foreground px-4 py-1">
                          Le plus populaire
                        </Badge>
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="absolute -top-3.5 right-4">
                        <Badge variant="outline" className="bg-accent text-accent-foreground px-3 py-1">
                          Votre plan
                        </Badge>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold">
                          {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground">/mois</span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan && subscription.subscribed ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleManageSubscription}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Gérer l'abonnement
                      </Button>
                    ) : plan.priceId ? (
                      <Button
                        variant={isPopular ? 'default' : 'outline'}
                        className={`w-full ${isPopular ? 'gradient-primary text-primary-foreground' : ''}`}
                        onClick={() => handleCheckout(plan.priceId!)}
                        disabled={checkoutLoading === plan.priceId}
                      >
                        {checkoutLoading === plan.priceId ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {isAuthenticated ? 'Passer au plan' : 'Commencer'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth?mode=signup')}
                      >
                        {isAuthenticated ? 'Plan actuel' : 'Commencer gratuitement'}
                      </Button>
                    )}
                  </motion.div>
                );
              }
            )}
          </div>

          {/* FAQ or extra info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16 text-sm text-muted-foreground"
          >
            <p>Tous les prix sont en euros HT. Annulez à tout moment.</p>
            <p className="mt-1">
              Besoin d'un plan sur mesure ?{' '}
              <a href="mailto:contact@formy.app" className="text-primary hover:underline">
                Contactez-nous
              </a>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
