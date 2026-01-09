import { FieldType } from '@/types/form';
import { 
  Type, 
  Mail, 
  Phone, 
  List, 
  CheckSquare, 
  Circle, 
  Calendar, 
  Clock, 
  AlignLeft,
  PenTool,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

const fieldTypes: { type: FieldType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'text', label: 'Texte', icon: Type, description: 'Champ de texte simple' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Adresse email avec validation' },
  { type: 'phone', label: 'Téléphone', icon: Phone, description: 'Numéro de téléphone' },
  { type: 'number', label: 'Nombre', icon: Hash, description: 'Champ numérique' },
  { type: 'textarea', label: 'Zone de texte', icon: AlignLeft, description: 'Texte multi-lignes' },
  { type: 'select', label: 'Liste déroulante', icon: List, description: 'Sélection unique' },
  { type: 'checkbox', label: 'Cases à cocher', icon: CheckSquare, description: 'Sélection multiple' },
  { type: 'radio', label: 'Choix unique', icon: Circle, description: 'Boutons radio' },
  { type: 'date', label: 'Date', icon: Calendar, description: 'Sélecteur de date' },
  { type: 'time', label: 'Heure', icon: Clock, description: 'Sélecteur d\'heure' },
  { type: 'signature', label: 'Signature', icon: PenTool, description: 'Champ de signature' },
];

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-3">Ajouter un champ</h3>
        <div className="grid grid-cols-2 gap-2">
          {fieldTypes.map((field) => (
            <button
              key={field.type}
              onClick={() => onAddField(field.type)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border border-border",
                "bg-card hover:bg-muted hover:border-primary/30 transition-all",
                "text-left text-sm"
              )}
            >
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <field.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{field.label}</p>
                <p className="text-xs text-muted-foreground truncate">{field.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
