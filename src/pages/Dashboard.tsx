import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  BarChart3, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const responseData = [
  { name: 'Lun', responses: 45 },
  { name: 'Mar', responses: 52 },
  { name: 'Mer', responses: 78 },
  { name: 'Jeu', responses: 65 },
  { name: 'Ven', responses: 89 },
  { name: 'Sam', responses: 34 },
  { name: 'Dim', responses: 23 },
];

const attendanceData = [
  { name: 'Lun', present: 45, absent: 5 },
  { name: 'Mar', present: 48, absent: 2 },
  { name: 'Mer', present: 42, absent: 8 },
  { name: 'Jeu', present: 47, absent: 3 },
  { name: 'Ven', present: 44, absent: 6 },
];

export default function Dashboard() {
  const { profile, organization } = useAuth();

  // Fetch forms count
  const { data: formsData } = useQuery({
    queryKey: ['forms-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { count: 0, forms: [] };
      const { data, count } = await supabase
        .from('forms')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization.id)
        .order('updated_at', { ascending: false })
        .limit(3);
      return { count: count || 0, forms: data || [] };
    },
    enabled: !!organization?.id,
  });

  // Fetch responses count
  const { data: responsesCount } = useQuery({
    queryKey: ['responses-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { data: forms } = await supabase
        .from('forms')
        .select('id')
        .eq('organization_id', organization.id);
      
      if (!forms?.length) return 0;
      
      const { count } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true })
        .in('form_id', forms.map(f => f.id));
      
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  const stats = [
    { 
      title: 'Formulaires', 
      value: formsData?.count?.toString() || '0', 
      change: '+2', 
      trend: 'up',
      icon: FileText,
      color: 'primary'
    },
    { 
      title: 'Réponses', 
      value: responsesCount?.toString() || '0', 
      change: '+18%', 
      trend: 'up',
      icon: BarChart3,
      color: 'accent'
    },
    { 
      title: 'Utilisateurs', 
      value: '1', 
      change: '+0', 
      trend: 'up',
      icon: Users,
      color: 'info'
    },
    { 
      title: 'Taux présence', 
      value: '—', 
      change: '—', 
      trend: 'up',
      icon: Clock,
      color: 'warning'
    },
  ];

  const displayName = profile?.full_name?.split(' ')[0] || 'Utilisateur';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Bonjour, {displayName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Voici un aperçu de votre activité cette semaine.
            </p>
          </div>
          <Link to="/dashboard/forms/new">
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Nouveau formulaire
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      stat.trend === 'up' ? 'text-success' : 'text-destructive'
                    }`}>
                      {stat.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Réponses cette semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={responseData}>
                      <defs>
                        <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="responses" 
                        stroke="hsl(221, 83%, 53%)" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorResponses)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Présences cette semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="present" stackId="a" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" stackId="a" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Forms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Formulaires récents</CardTitle>
              <Link to="/dashboard/forms">
                <Button variant="ghost" size="sm">
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formsData?.forms && formsData.forms.length > 0 ? (
                  formsData.forms.map((form: any) => (
                    <div 
                      key={form.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{form.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {form.is_published ? 'Publié' : 'Brouillon'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(form.updated_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun formulaire pour le moment</p>
                    <Link to="/dashboard/forms/new">
                      <Button variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Créer mon premier formulaire
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
