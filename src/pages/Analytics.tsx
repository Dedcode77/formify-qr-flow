import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Calendar,
  Target,
  Loader2,
  ArrowUpRight
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(280, 67%, 53%)', 'hsl(0, 84%, 60%)'];

export default function Analytics() {
  const { organization } = useAuth();

  // Fetch all forms with response counts
  const { data: formsData, isLoading: formsLoading } = useQuery({
    queryKey: ['analytics-forms', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch all responses for the organization's forms
  const { data: allResponses, isLoading: responsesLoading } = useQuery({
    queryKey: ['analytics-responses', formsData?.map(f => f.id)],
    queryFn: async () => {
      if (!formsData?.length) return [];
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .in('form_id', formsData.map(f => f.id))
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!formsData?.length,
  });

  // Calculate daily submissions for the last 30 days
  const dailyTrendData = useMemo(() => {
    if (!allResponses) return [];
    
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStart = startOfDay(day);
      const count = allResponses.filter(r => {
        const responseDate = startOfDay(new Date(r.submitted_at));
        return responseDate.getTime() === dayStart.getTime();
      }).length;

      return {
        date: format(day, 'dd MMM', { locale: fr }),
        fullDate: format(day, 'dd MMMM yyyy', { locale: fr }),
        responses: count
      };
    });
  }, [allResponses]);

  // Calculate weekly comparison
  const weeklyComparison = useMemo(() => {
    if (!allResponses) return { current: 0, previous: 0, change: 0 };
    
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisWeekCount = allResponses.filter(r => {
      const date = new Date(r.submitted_at);
      return date >= thisWeekStart && date <= thisWeekEnd;
    }).length;

    const lastWeekCount = allResponses.filter(r => {
      const date = new Date(r.submitted_at);
      return date >= lastWeekStart && date <= lastWeekEnd;
    }).length;

    const change = lastWeekCount > 0 
      ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
      : thisWeekCount > 0 ? 100 : 0;

    return { current: thisWeekCount, previous: lastWeekCount, change };
  }, [allResponses]);

  // Popular forms (by response count)
  const popularForms = useMemo(() => {
    if (!formsData || !allResponses) return [];
    
    return formsData
      .map(form => ({
        id: form.id,
        name: form.name,
        slug: form.slug,
        isPublished: form.is_published,
        responses: allResponses.filter(r => r.form_id === form.id).length,
        lastResponse: allResponses.find(r => r.form_id === form.id)?.submitted_at
      }))
      .sort((a, b) => b.responses - a.responses)
      .slice(0, 5);
  }, [formsData, allResponses]);

  // Pie chart data for form distribution
  const formDistribution = useMemo(() => {
    if (!popularForms.length) return [];
    
    const totalResponses = popularForms.reduce((acc, f) => acc + f.responses, 0);
    if (totalResponses === 0) return [];

    return popularForms.map((form, index) => ({
      name: form.name.length > 20 ? form.name.slice(0, 20) + '...' : form.name,
      value: form.responses,
      percentage: Math.round((form.responses / totalResponses) * 100),
      color: COLORS[index % COLORS.length]
    }));
  }, [popularForms]);

  // Response rate by day of week
  const responsesByDayOfWeek = useMemo(() => {
    if (!allResponses) return [];
    
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    allResponses.forEach(r => {
      const day = new Date(r.submitted_at).getDay();
      counts[day]++;
    });

    // Reorder to start with Monday
    return [
      { day: 'Lun', responses: counts[1] },
      { day: 'Mar', responses: counts[2] },
      { day: 'Mer', responses: counts[3] },
      { day: 'Jeu', responses: counts[4] },
      { day: 'Ven', responses: counts[5] },
      { day: 'Sam', responses: counts[6] },
      { day: 'Dim', responses: counts[0] },
    ];
  }, [allResponses]);

  const isLoading = formsLoading || responsesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const totalForms = formsData?.length || 0;
  const publishedForms = formsData?.filter(f => f.is_published).length || 0;
  const totalResponses = allResponses?.length || 0;
  const avgResponsesPerForm = totalForms > 0 ? Math.round(totalResponses / totalForms) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytiques</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble des performances de vos formulaires
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    weeklyComparison.change >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {weeklyComparison.change >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {weeklyComparison.change >= 0 ? '+' : ''}{weeklyComparison.change}%
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{totalResponses}</p>
                  <p className="text-sm text-muted-foreground">Total réponses</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <Badge variant="secondary">{publishedForms} publiés</Badge>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{totalForms}</p>
                  <p className="text-sm text-muted-foreground">Formulaires</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-info" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{avgResponsesPerForm}</p>
                  <p className="text-sm text-muted-foreground">Moy. réponses/form</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-warning" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{weeklyComparison.current}</p>
                  <p className="text-sm text-muted-foreground">Réponses cette semaine</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Submission Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Tendance des soumissions (30 jours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {dailyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyTrendData}>
                        <defs>
                          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={10}
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="responses" 
                          stroke="hsl(221, 83%, 53%)" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorTrend)"
                          name="Réponses"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Pas encore de données
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Responses by Day of Week */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Réponses par jour de la semaine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {responsesByDayOfWeek.some(d => d.responses > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={responsesByDayOfWeek}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="responses" 
                          fill="hsl(221, 83%, 53%)" 
                          radius={[4, 4, 0, 0]}
                          name="Réponses"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Pas encore de données
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Popular Forms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Formulaires populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                {popularForms.length > 0 ? (
                  <div className="space-y-4">
                    {popularForms.map((form, index) => (
                      <Link 
                        key={form.id}
                        to={`/dashboard/forms/${form.id}/responses`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">
                              {form.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {form.isPublished ? 'Publié' : 'Brouillon'}
                              {form.lastResponse && ` • Dernière: ${format(new Date(form.lastResponse), 'dd MMM', { locale: fr })}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{form.responses}</Badge>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Aucun formulaire
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Form Distribution Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Distribution des réponses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {formDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {formDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number, name: string) => [`${value} réponses (${formDistribution.find(f => f.name === name)?.percentage}%)`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Pas encore de données
                    </div>
                  )}
                </div>
                {/* Legend */}
                {formDistribution.length > 0 && (
                  <div className="flex flex-wrap gap-3 justify-center mt-2">
                    {formDistribution.map((form, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: form.color }}
                        />
                        <span className="text-muted-foreground">{form.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
