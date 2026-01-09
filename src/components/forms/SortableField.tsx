import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField, FieldType } from '@/types/form';
import { GripVertical, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Texte',
  email: 'Email',
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

export function SortableField({ field, isSelected, onSelect, onRemove }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "field-item group",
        isDragging && "opacity-50 shadow-lg",
        isSelected && "border-primary ring-2 ring-primary/20"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{field.label}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {fieldTypeLabels[field.type]}
            </span>
            {field.required && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                Requis
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
