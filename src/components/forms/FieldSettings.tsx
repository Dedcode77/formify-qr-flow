import { FormField } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface FieldSettingsProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}

export function FieldSettings({ field, onUpdate }: FieldSettingsProps) {
  const hasOptions = ['select', 'checkbox', 'radio'].includes(field.type);

  const addOption = () => {
    const newOption = {
      id: `option-${Date.now()}`,
      label: `Option ${(field.options?.length || 0) + 1}`,
      value: `option-${(field.options?.length || 0) + 1}`,
    };
    onUpdate({ options: [...(field.options || []), newOption] });
  };

  const updateOption = (optionId: string, label: string) => {
    const updatedOptions = field.options?.map((opt) =>
      opt.id === optionId ? { ...opt, label, value: label.toLowerCase().replace(/\s+/g, '-') } : opt
    );
    onUpdate({ options: updatedOptions });
  };

  const removeOption = (optionId: string) => {
    onUpdate({ options: field.options?.filter((opt) => opt.id !== optionId) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Paramètres du champ</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Libellé</Label>
            <Input
              id="label"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Libellé du champ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Texte d'aide..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Champ requis</Label>
              <p className="text-xs text-muted-foreground">
                L'utilisateur doit remplir ce champ
              </p>
            </div>
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>
        </div>
      </div>

      {hasOptions && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label>Options</Label>
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>

          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  placeholder="Libellé de l'option"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeOption(option.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {(!field.options || field.options.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune option. Cliquez sur "Ajouter" pour créer des options.
              </p>
            )}
          </div>
        </div>
      )}

      {(field.type === 'text' || field.type === 'textarea' || field.type === 'number') && (
        <div className="space-y-4 pt-4 border-t">
          <Label>Validation</Label>
          
          {field.type === 'number' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min" className="text-xs">Minimum</Label>
                <Input
                  id="min"
                  type="number"
                  value={field.validation?.min || ''}
                  onChange={(e) => onUpdate({ 
                    validation: { ...field.validation, min: Number(e.target.value) } 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max" className="text-xs">Maximum</Label>
                <Input
                  id="max"
                  type="number"
                  value={field.validation?.max || ''}
                  onChange={(e) => onUpdate({ 
                    validation: { ...field.validation, max: Number(e.target.value) } 
                  })}
                />
              </div>
            </div>
          )}

          {(field.type === 'text' || field.type === 'textarea') && (
            <div className="space-y-2">
              <Label htmlFor="maxLength" className="text-xs">Longueur max (caractères)</Label>
              <Input
                id="maxLength"
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => onUpdate({ 
                  validation: { ...field.validation, max: Number(e.target.value) } 
                })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
