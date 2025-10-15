# @anarchitects/forms-ts

Schema-first form configuration and validation library built with TypeBox. Define forms declaratively and generate runtime validation schemas automatically.

## Features

- 🏗️ **Declarative Form Configuration** - Define forms with field types, validation rules, and UI metadata
- ⚡ **Runtime Schema Generation** - Automatically generate TypeBox schemas from form configs
- 🔒 **Type Safety** - Full TypeScript support with inferred types
- 🎯 **Field Validation** - Built-in support for strings, emails, textareas, booleans, selects, and file uploads
- 🛡️ **Security Features** - Honeypot and CAPTCHA integration options
- 📧 **Delivery Configuration** - Email notifications and webhook support

## Installation

```bash
npm install @anarchitects/forms-ts @sinclair/typebox
```

## Quick Start

```typescript
import { FormConfig, schemaFromConfig } from '@anarchitects/forms-ts';
import { Value } from '@sinclair/typebox/value';

// Define your form configuration
const contactForm: FormConfig = {
  id: 'contact_form',
  version: 1,
  fields: [
    {
      name: 'name',
      kind: 'string',
      required: true,
      minLength: 2,
      maxLength: 100,
      ui: { label: 'Full Name' },
    },
    {
      name: 'email',
      kind: 'email',
      required: true,
      ui: { label: 'Email Address' },
    },
    {
      name: 'message',
      kind: 'textarea',
      required: true,
      minLength: 10,
      ui: { label: 'Message', rows: 5 },
    },
  ],
  security: { honeypot: 'website' },
  delivery: { adminEmail: 'admin@example.com' },
};

// Generate validation schema
const schema = schemaFromConfig(contactForm);

// Validate form data
const formData = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello world!',
};

const isValid = Value.Check(schema, formData);
console.log(isValid); // true

// Get validation errors
const errors = [...Value.Errors(schema, formData)];
console.log(errors); // []
```

## Field Types

### String Field

```typescript
{
  name: 'username',
  kind: 'string',
  required: true,
  minLength: 3,
  maxLength: 20,
  pattern: '^[a-zA-Z0-9_]+$',
  ui: { label: 'Username', placeholder: 'Enter username' }
}
```

### Email Field

```typescript
{
  name: 'email',
  kind: 'email',
  required: true,
  ui: { label: 'Email Address' }
}
```

### Textarea Field

```typescript
{
  name: 'description',
  kind: 'textarea',
  required: false,
  maxLength: 500,
  ui: { label: 'Description', rows: 4, help: 'Optional description' }
}
```

### Boolean Field

```typescript
{
  name: 'subscribe',
  kind: 'boolean',
  required: true,
  ui: { label: 'Subscribe to newsletter' }
}
```

### Select Field

```typescript
{
  name: 'country',
  kind: 'select',
  required: true,
  options: [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' }
  ],
  ui: { label: 'Country' }
}
```

### File Upload Field

```typescript
{
  name: 'attachment',
  kind: 'file',
  required: false,
  ui: { label: 'Upload File', help: 'Max 10MB' }
}
```

## Security Configuration

```typescript
const secureForm: FormConfig = {
  // ... other config
  security: {
    honeypot: 'website', // Honeypot field name
    captcha: 'turnstile', // 'turnstile' | 'hcaptcha' | 'none'
  },
};
```

## Delivery Configuration

```typescript
const formWithDelivery: FormConfig = {
  // ... other config
  delivery: {
    adminEmail: 'admin@example.com',
    autoReply: {
      enabled: true,
      templateId: 'contact_confirmation',
    },
    webhooks: [
      {
        url: 'https://api.example.com/webhook',
        secret: 'webhook-secret',
      },
    ],
  },
};
```

## API Reference

### Types

- `FormConfig` - Main form configuration interface
- `FormField` - Individual field configuration
- `FieldKind` - Union of supported field types
- `SubmissionDTO` - Generated submission data type

### Functions

- `schemaFromConfig(config: FormConfig)` - Generate TypeBox schema from form config

## Exports

The library provides subpath exports for better tree-shaking:

```typescript
// Main exports (models)
import { FormConfig, contactForm } from '@anarchitects/forms-ts';

// Models only
import { FormField, FieldKind } from '@anarchitects/forms-ts/models';

// DTOs only
import { SubmissionDTO } from '@anarchitects/forms-ts/dtos';
```

## Contributing

This library is part of the [Anarchitecture Bricks](https://github.com/anarchitects/anarchitecture-bricks-3tier) monorepo. See the main repository for contribution guidelines.

## License

MIT
