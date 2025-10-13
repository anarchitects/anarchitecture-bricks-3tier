export type FieldKind =
  | 'string'
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
    autoReply?: { enabled: boolean; templateId: string };
    webhooks?: { url: string; secret?: string }[];
  };
}
