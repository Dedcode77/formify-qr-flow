import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download, 
  Loader2, 
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  BarChart3,
  Filter,
  ArrowUpDown,
  Search,
  X
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
import { format, subDays, startOfDay, eachDayOfInterval, isAfter, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
}

type SortDirection = 'asc' | 'desc';
type SortField = 'date' | string;

export default function FormResponses() {
  const { id } = useParams();
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState('');
  
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

  // Filter and sort responses
  const filteredResponses = useMemo(() => {
    if (!responses) return [];
    
    let filtered = [...responses];
    
    // Date range filter
    if (dateFrom) {
      const fromDate = parseISO(dateFrom);
      filtered = filtered.filter(r => isAfter(new Date(r.submitted_at), fromDate) || 
        startOfDay(new Date(r.submitted_at)).getTime() === startOfDay(fromDate).getTime());
    }
    if (dateTo) {
      const toDate = parseISO(dateTo);
      filtered = filtered.filter(r => isBefore(new Date(r.submitted_at), toDate) ||
        startOfDay(new Date(r.submitted_at)).getTime() === startOfDay(toDate).getTime());
    }
    
    // Search term filter (searches all text fields)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        const data = r.data as Record<string, unknown>;
        return Object.values(data).some(v => 
          String(v).toLowerCase().includes(search)
        );
      });
    }
    
    // Specific field filter
    if (filterField && filterValue) {
      filtered = filtered.filter(r => {
        const data = r.data as Record<string, unknown>;
        const value = data[filterField];
        if (Array.isArray(value)) {
          return value.some(v => String(v).toLowerCase().includes(filterValue.toLowerCase()));
        }
        return String(value || '').toLowerCase().includes(filterValue.toLowerCase());
      });
    }
    
    // Sorting
    filtered.sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.submitted_at).getTime();
        const dateB = new Date(b.submitted_at).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const dataA = a.data as Record<string, unknown>;
        const dataB = b.data as Record<string, unknown>;
        const valueA = String(dataA[sortField] || '');
        const valueB = String(dataB[sortField] || '');
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
    });
    
    return filtered;
  }, [responses, dateFrom, dateTo, searchTerm, filterField, filterValue, sortField, sortDirection]);

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setFilterField('');
    setFilterValue('');
    setSortField('date');
    setSortDirection('desc');
  };

  const hasActiveFilters = searchTerm || dateFrom || dateTo || filterField || filterValue;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filtres et tri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Date from */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Du</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              {/* Date to */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Au</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              {/* Filter by field */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Filtrer par champ</label>
                <Select value={filterField} onValueChange={setFilterField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un champ" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map(field => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter value (shown when field selected) */}
            {filterField && (
              <div className="mt-4">
                <Input
                  placeholder={`Valeur pour "${fields.find(f => f.id === filterField)?.label}"...`}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              </div>
            )}

            {/* Active filters summary */}
            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredResponses.length} résultat{filteredResponses.length > 1 ? 's' : ''}
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Effacer les filtres
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responses Table */}
        <Card>
          <CardContent className="p-0">
            {filteredResponses && filteredResponses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="min-w-[150px] cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          <ArrowUpDown className={`w-4 h-4 ${sortField === 'date' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                      </TableHead>
                      {fields.map(field => (
                        <TableHead 
                          key={field.id} 
                          className="min-w-[150px] cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort(field.id)}
                        >
                          <div className="flex items-center gap-1">
                            {field.label}
                            <ArrowUpDown className={`w-4 h-4 ${sortField === field.id ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((response, index) => {
                      const data = response.data as Record<string, unknown>;
                      return (
                        <motion.tr
                          key={response.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(index * 0.02, 0.5) }}
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
                <h3 className="font-semibold mb-2">
                  {hasActiveFilters ? 'Aucun résultat' : 'Aucune réponse'}
                </h3>
                <p className="text-muted-foreground">
                  {hasActiveFilters 
                    ? 'Essayez de modifier vos filtres.'
                    : 'Les réponses à ce formulaire apparaîtront ici.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
