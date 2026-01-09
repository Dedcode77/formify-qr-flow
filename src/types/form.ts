export type FieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'date' 
  | 'time' 
  | 'textarea'
  | 'signature'
  | 'number';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Form {
  id: string;
  name: string;
  slug: string;
  description?: string;
  fields: FormField[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  responses: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  submittedAt: Date;
  userId?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  checkIn: Date;
  checkOut?: Date;
  method: 'manual' | 'form' | 'qrcode';
  organizationId: string;
  location?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  organizationId: string;
  plan: 'free' | 'pro' | 'business';
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'business';
  members: number;
  formsLimit: number;
  responsesLimit: number;
}
