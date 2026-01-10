import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FieldPalette } from '@/components/forms/FieldPalette';
import { SortableField } from '@/components/forms/SortableField';
import { FieldSettings } from '@/components/forms/FieldSettings';
import { FormPreview } from '@/components/forms/FormPreview';
import { useFormStore } from '@/stores/formStore';
import { FieldType, FormField } from '@/types/form';
import { ArrowLeft, Save, Eye, Settings, Layers, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

export default function FormBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, organization } = useAuth();
  const { fields, selectedFieldId, addField, removeField, updateField, reorderFields, selectField, clearFields } = useFormStore();
  
  const [formName, setFormName] = useState('Nouveau formulaire');
  const [formDescription, setFormDescription] = useState('');
  const [activeTab, setActiveTab] = useState('builder');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !user?.id) {
        throw new Error('Organization or user not found');
      }

      const slug = formName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50) + '-' + Date.now().toString(36);

      const { data, error } = await supabase
        .from('forms')
        .insert({
          organization_id: organization.id,
          name: formName,
          slug,
          description: formDescription,
          fields: fields as any,
          created_by: user.id,
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Formulaire sauvegardé',
        description: 'Votre formulaire a été créé avec succès.',
      });
      clearFields();
      navigate('/dashboard/forms');
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      reorderFields(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: getDefaultLabel(type),
      placeholder: '',
      required: false,
      options: ['select', 'checkbox', 'radio'].includes(type) 
        ? [
            { id: 'opt-1', label: 'Option 1', value: 'option-1' },
            { id: 'opt-2', label: 'Option 2', value: 'option-2' },
          ]
        : undefined,
    };
    addField(newField);
    selectField(newField.id);
  };

  const getDefaultLabel = (type: FieldType): string => {
    const labels: Record<FieldType, string> = {
      text: 'Champ texte',
      email: 'Adresse email',
      phone: 'Téléphone',
      select: 'Liste déroulante',
      checkbox: 'Cases à cocher',
      radio: 'Choix unique',
      date: 'Date',
      time: 'Heure',
      textarea: 'Zone de texte',
      signature: 'Signature',
      number: 'Nombre',
    };
    return labels[type];
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handleSave = () => {
    if (!formName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez donner un nom à votre formulaire.',
        variant: 'destructive',
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Ajoutez au moins un champ à votre formulaire.',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/forms')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {fields.length} champ{fields.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setActiveTab('preview')}>
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
            <Button variant="hero" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="ml-2">Sauvegarder</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mb-4 self-start">
            <TabsTrigger value="builder" className="gap-2">
              <Layers className="w-4 h-4" />
              Éditeur
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="flex-1 mt-0">
            <div className="grid lg:grid-cols-12 gap-6 h-full">
              {/* Field Palette */}
              <div className="lg:col-span-3">
                <Card className="h-full">
                  <CardContent className="p-4">
                    <FieldPalette onAddField={handleAddField} />
                  </CardContent>
                </Card>
              </div>

              {/* Drop Zone */}
              <div className="lg:col-span-5">
                <Card className="h-full">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Structure du formulaire</h3>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={fields.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2 min-h-[300px]">
                          {fields.length === 0 ? (
                            <div className="drop-zone flex items-center justify-center">
                              <p className="text-muted-foreground text-center">
                                Cliquez sur un type de champ pour l'ajouter
                              </p>
                            </div>
                          ) : (
                            fields.map((field) => (
                              <SortableField
                                key={field.id}
                                field={field}
                                isSelected={selectedFieldId === field.id}
                                onSelect={() => selectField(field.id)}
                                onRemove={() => removeField(field.id)}
                              />
                            ))
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                </Card>
              </div>

              {/* Field Settings */}
              <div className="lg:col-span-4">
                <Card className="h-full">
                  <CardContent className="p-4">
                    {selectedField ? (
                      <FieldSettings
                        field={selectedField}
                        onUpdate={(updates) => updateField(selectedField.id, updates)}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                        <p>Sélectionnez un champ pour modifier ses paramètres</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 mt-0">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-2">{formName}</h2>
                {formDescription && (
                  <p className="text-muted-foreground mb-8">{formDescription}</p>
                )}
                <FormPreview fields={fields} />
                {fields.length > 0 && (
                  <Button variant="hero" className="w-full mt-8" disabled>
                    Envoyer
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 mt-0">
            <Card className="max-w-2xl">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>Nom du formulaire</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea 
                    className="w-full min-h-[100px] px-3 py-2 rounded-lg border bg-background resize-none"
                    placeholder="Décrivez votre formulaire..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
