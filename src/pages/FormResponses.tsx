import { useState } from 'react';
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
  User
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
        .single();
      
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
                  Champs du formulaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{fields.length}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

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
