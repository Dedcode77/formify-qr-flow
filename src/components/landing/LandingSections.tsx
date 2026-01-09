import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  QrCode, 
  FileSpreadsheet,
  Check,
  Star 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function Hero() {
  return (
    <section className="relative overflow-hidden section-padding">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container-wide mx-auto">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              Nouveau : Gestion de présence par QR Code
            </span>
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            Créez des formulaires{' '}
            <span className="gradient-text">puissants</span>
            <br />
            en quelques minutes
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Formy vous permet de construire des formulaires dynamiques en drag & drop, 
            gérer la présence de vos équipes, et analyser vos données en temps réel.
          </motion.p>

          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/dashboard">
              <Button variant="hero" size="xl">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="hero-outline" size="xl">
                Voir les tarifs
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>Sans carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>Configuration en 2 min</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>Support 24/7</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Image / Dashboard Preview */}
        <motion.div 
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 lg:mt-20"
        >
          <div className="relative mx-auto max-w-5xl">
            <div className="glass-card rounded-2xl p-2 sm:p-4 shadow-2xl">
              <div className="bg-card rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                      formy.app/dashboard
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-br from-muted/50 to-background min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                      <FileSpreadsheet className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Aperçu du tableau de bord</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -left-4 top-1/4 hidden lg:block">
              <div className="glass-card rounded-xl p-4 shadow-lg animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">+127</p>
                    <p className="text-xs text-muted-foreground">Réponses aujourd'hui</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-4 top-1/3 hidden lg:block" style={{ animationDelay: '1s' }}>
              <div className="glass-card rounded-xl p-4 shadow-lg animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">98.5%</p>
                    <p className="text-xs text-muted-foreground">Taux de présence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Features() {
  const features = [
    {
      icon: FileSpreadsheet,
      title: 'Form Builder Drag & Drop',
      description: 'Créez des formulaires complexes en quelques clics avec notre éditeur intuitif.',
      color: 'primary'
    },
    {
      icon: QrCode,
      title: 'Pointage par QR Code',
      description: 'Générez des QR codes uniques pour une gestion de présence moderne et rapide.',
      color: 'accent'
    },
    {
      icon: BarChart3,
      title: 'Analytics en temps réel',
      description: 'Visualisez vos données avec des tableaux de bord interactifs et personnalisables.',
      color: 'info'
    },
    {
      icon: Shield,
      title: 'Sécurité renforcée',
      description: 'Vos données sont chiffrées et protégées selon les standards les plus stricts.',
      color: 'success'
    },
    {
      icon: Users,
      title: 'Multi-tenant',
      description: 'Gérez plusieurs organisations avec des espaces de travail isolés.',
      color: 'warning'
    },
    {
      icon: Zap,
      title: 'Intégrations',
      description: 'Connectez Formy à vos outils préférés via notre API et webhooks.',
      color: 'primary'
    }
  ];

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-wide mx-auto">
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg text-muted-foreground">
            Une plateforme complète pour créer, gérer et analyser vos formulaires et présences.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass-card rounded-2xl p-6 hover-lift"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Créez votre formulaire',
      description: 'Utilisez notre éditeur drag & drop pour construire votre formulaire en quelques minutes.'
    },
    {
      step: '02',
      title: 'Partagez le lien',
      description: 'Publiez votre formulaire et partagez le lien ou le QR code avec vos utilisateurs.'
    },
    {
      step: '03',
      title: 'Analysez les résultats',
      description: 'Consultez les réponses en temps réel et exportez vos données en CSV.'
    }
  ];

  return (
    <section className="section-padding">
      <div className="container-wide mx-auto">
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Comment ça marche
          </h2>
          <p className="text-lg text-muted-foreground">
            Trois étapes simples pour commencer à collecter des données.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              className="relative text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground text-2xl font-bold mb-6">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UseCases() {
  const cases = [
    {
      title: 'Ressources Humaines',
      description: 'Gérez les présences, congés et formulaires d\'évaluation de vos équipes.',
      image: '👥'
    },
    {
      title: 'Événements',
      description: 'Inscriptions, check-in par QR code et collecte de feedback.',
      image: '🎉'
    },
    {
      title: 'Éducation',
      description: 'Feuilles de présence, examens en ligne et sondages étudiants.',
      image: '🎓'
    },
    {
      title: 'Santé',
      description: 'Formulaires patients, suivi des rendez-vous et enquêtes satisfaction.',
      image: '🏥'
    }
  ];

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-wide mx-auto">
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Cas d'usage
          </h2>
          <p className="text-lg text-muted-foreground">
            Formy s'adapte à tous les secteurs d'activité.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cases.map((item, index) => (
            <motion.div
              key={item.title}
              className="glass-card rounded-2xl p-6 text-center hover-lift"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-4xl mb-4">{item.image}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '0€',
      period: '/mois',
      description: 'Parfait pour découvrir Formy',
      features: [
        '3 formulaires',
        '100 réponses/mois',
        'Champs de base',
        'Export CSV',
        '1 utilisateur'
      ],
      cta: 'Commencer',
      popular: false
    },
    {
      name: 'Pro',
      price: '19€',
      period: '/mois',
      description: 'Pour les équipes en croissance',
      features: [
        'Formulaires illimités',
        '5 000 réponses/mois',
        'Tous les champs',
        'QR Code & présence',
        '10 utilisateurs',
        'Support prioritaire'
      ],
      cta: 'Essai gratuit 14 jours',
      popular: true
    },
    {
      name: 'Business',
      price: '49€',
      period: '/mois',
      description: 'Pour les grandes organisations',
      features: [
        'Tout dans Pro',
        'Réponses illimitées',
        'Utilisateurs illimités',
        'API & Webhooks',
        'SSO & SAML',
        'Support dédié'
      ],
      cta: 'Contacter',
      popular: false
    }
  ];

  return (
    <section className="section-padding" id="pricing">
      <div className="container-wide mx-auto">
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Tarification simple et transparente
          </h2>
          <p className="text-lg text-muted-foreground">
            Choisissez le plan qui correspond à vos besoins. Évoluez à tout moment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.popular 
                  ? 'glass-card border-2 border-primary shadow-glow' 
                  : 'bg-card border border-border'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-sm font-medium">
                    <Star className="w-3 h-3" />
                    Populaire
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.popular ? 'hero' : 'outline'} 
                className="w-full"
                size="lg"
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="section-padding">
      <div className="container-narrow mx-auto">
        <motion.div 
          className="relative rounded-3xl gradient-primary p-8 sm:p-12 lg:p-16 text-center overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              Prêt à transformer vos formulaires ?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Rejoignez des milliers d'entreprises qui utilisent Formy pour collecter et analyser leurs données.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                  Démarrer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container-wide mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Formy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              La plateforme SaaS pour créer des formulaires et gérer les présences.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Intégrations</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Ressources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">CGU</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2024 Formy. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
