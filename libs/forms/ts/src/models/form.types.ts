export type FieldKind =
  | 'string'
  | 'password'
  | 'email'
  | 'textarea'
  | 'boolean'
  | 'select'
  | 'file';

export interface FormField {
  name: string;
  kind: FieldKind;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: { value: string; label: string }[];
  ui?: { label?: string; placeholder?: string; rows?: number; help?: string };
}

export interface FormConfig {
  id: string;
  version: number;
  fields: FormField[];
  security?: { honeypot?: string; captcha?: 'turnstile' | 'hcaptcha' | 'none' };
  delivery?: {
    adminEmail?: string;
    subject?: string;
    templateId?: string;
    autoReply?: { enabled: boolean; templateId: string; subject: string };
    webhooks?: { url: string; secret?: string }[];
  };
}
