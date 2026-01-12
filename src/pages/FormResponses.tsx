import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Download, 
  Loader2, 
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
}

export default function FormResponses() {
  const { id } = useParams();
  
  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ['form-responses', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', id)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const fields: FormField[] = form?.fields 
    ? (Array.isArray(form.fields) ? (form.fields as unknown as FormField[]) : [])
    : [];

  // Calculate daily responses for the chart
  const chartData = useMemo(() => {
    if (!responses) return [];
    
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    });

    return last14Days.map(day => {
      const dayStart = startOfDay(day);
      const count = responses.filter(r => {
        const responseDate = startOfDay(new Date(r.submitted_at));
        return responseDate.getTime() === dayStart.getTime();
      }).length;

      return {
        date: format(day, 'dd MMM', { locale: fr }),
        responses: count
      };
    });
  }, [responses]);

  // Calculate completion stats per field
  const fieldStats = useMemo(() => {
    if (!responses || !fields.length) return [];
    
    return fields.slice(0, 5).map(field => {
      const filledCount = responses.filter(r => {
        const data = r.data as Record<string, unknown>;
        const value = data[field.id];
        return value !== undefined && value !== null && value !== '';
      }).length;

      return {
        name: field.label.length > 15 ? field.label.slice(0, 15) + '...' : field.label,
        taux: responses.length > 0 ? Math.round((filledCount / responses.length) * 100) : 0
      };
    });
  }, [responses, fields]);

  const exportToCSV = () => {
    if (!responses || !fields.length) return;

    const headers = ['Date de soumission', ...fields.map(f => f.label)];
    
    const rows = responses.map(response => {
      const data = response.data as Record<string, unknown>;
      return [
        new Date(response.submitted_at).toLocaleString('fr-FR'),
        ...fields.map(f => {
          const value = data[f.id];
          if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
          if (Array.isArray(value)) return value.join(', ');
          return String(value || '');
        })
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${form?.name || 'formulaire'}_reponses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const isLoading = formLoading || responsesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!form) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Formulaire introuvable</h3>
          <p className="text-muted-foreground mb-4">
            Ce formulaire n'existe pas ou a été supprimé.
          </p>
          <Link to="/dashboard/forms">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux formulaires
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard/forms">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{form?.name}</h1>
              <p className="text-muted-foreground mt-1">
                {responses?.length || 0} réponse{(responses?.length || 0) > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button 
            variant="hero" 
            onClick={exportToCSV}
            disabled={!responses?.length}
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total réponses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{responses?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Dernière réponse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">
                    {responses?.[0] 
                      ? new Date(responses[0].submitted_at).toLocaleDateString('fr-FR')
                      : 'Aucune'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Moyenne / jour (14j)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {chartData.length > 0 
                      ? (chartData.reduce((acc, d) => acc + d.responses, 0) / chartData.length).toFixed(1)
                      : '0'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        {responses && responses.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Daily responses chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Réponses par jour (14 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="responses"
                          name="Réponses"
                          stroke="hsl(var(--primary))"
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

            {/* Field completion chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Taux de complétion par champ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fieldStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value) => [`${value}%`, 'Taux']}
                        />
                        <Bar 
                          dataKey="taux" 
                          fill="hsl(var(--primary))" 
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Responses Table */}
        <Card>
          <CardContent className="p-0">
            {responses && responses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Date</TableHead>
                      {fields.map(field => (
                        <TableHead key={field.id} className="min-w-[150px]">
                          {field.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response, index) => {
                      const data = response.data as Record<string, unknown>;
                      return (
                        <motion.tr
                          key={response.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {new Date(response.submitted_at).toLocaleString('fr-FR')}
                          </TableCell>
                          {fields.map(field => {
                            const value = data[field.id];
                            let displayValue: string;
                            
                            if (typeof value === 'boolean') {
                              displayValue = value ? 'Oui' : 'Non';
                            } else if (Array.isArray(value)) {
                              displayValue = value.join(', ');
                            } else if (field.type === 'signature' && typeof value === 'string') {
                              displayValue = '[Signature]';
                            } else {
                              displayValue = String(value || '-');
                            }
                            
                            return (
                              <TableCell key={field.id}>
                                {field.type === 'signature' && value ? (
                                  <img 
                                    src={value as string} 
                                    alt="Signature" 
                                    className="h-8 w-auto max-w-[100px]"
                                  />
                                ) : (
                                  <span className="truncate max-w-[200px] block">
                                    {displayValue}
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Aucune réponse</h3>
                <p className="text-muted-foreground">
                  Les réponses à ce formulaire apparaîtront ici.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
