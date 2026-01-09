import { FormField } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FormPreviewProps {
  fields: FormField[];
  className?: string;
}

export function FormPreview({ fields, className }: FormPreviewProps) {
  if (fields.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-center", className)}>
        <div>
          <p className="text-muted-foreground">Aucun champ dans le formulaire</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ajoutez des champs depuis la palette de gauche
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label className="flex items-center gap-1">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>

          {field.type === 'text' && (
            <Input placeholder={field.placeholder} disabled />
          )}

          {field.type === 'email' && (
            <Input type="email" placeholder={field.placeholder || 'email@exemple.com'} disabled />
          )}

          {field.type === 'phone' && (
            <Input type="tel" placeholder={field.placeholder || '+33 6 00 00 00 00'} disabled />
          )}

          {field.type === 'number' && (
            <Input type="number" placeholder={field.placeholder} disabled />
          )}

          {field.type === 'textarea' && (
            <Textarea placeholder={field.placeholder} disabled rows={4} />
          )}

          {field.type === 'date' && (
            <Input type="date" disabled />
          )}

          {field.type === 'time' && (
            <Input type="time" disabled />
          )}

          {field.type === 'select' && (
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Sélectionner...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.type === 'checkbox' && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox id={option.id} disabled />
                  <Label htmlFor={option.id} className="font-normal">{option.label}</Label>
                </div>
              ))}
              {(!field.options || field.options.length === 0) && (
                <p className="text-sm text-muted-foreground">Aucune option configurée</p>
              )}
            </div>
          )}

          {field.type === 'radio' && (
            <RadioGroup disabled>
              {field.options?.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value} id={option.id} />
                  <Label htmlFor={option.id} className="font-normal">{option.label}</Label>
                </div>
              ))}
              {(!field.options || field.options.length === 0) && (
                <p className="text-sm text-muted-foreground">Aucune option configurée</p>
              )}
            </RadioGroup>
          )}

          {field.type === 'signature' && (
            <div className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
              <p className="text-sm text-muted-foreground">Zone de signature</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
