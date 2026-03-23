# @anarchitects/forms-ts

Schema-first form configuration and validation library built with TypeBox. Define forms declaratively
and generate runtime validation schemas automatically.

## Developer + AI Agent Start Here

- Read this README before generating DTO/model code that depends on `@anarchitects/forms-ts`.
- Treat this package as the contract source of truth for forms models/DTOs used by Angular and Nest packages.
- Prefer public exports (`@anarchitects/forms-ts`, `/builders`, `/dtos`, `/models`) and avoid internal path imports.
- Keep framework-specific behavior outside this package.

## Features

- 🏗️ **Declarative Form Configuration** - Define forms with field types, validation rules, and UI metadata
- ⚡ **Runtime Schema Generation** - Automatically generate TypeBox schemas from form configs
- 🔒 **Type Safety** - Full TypeScript support with inferred types
- 🎯 **Field Validation** - Built-in support for strings, emails, textareas, booleans, selects, and file uploads
- 🔁 **Cross-Field Validation Rules** - Declarative transport-safe rules such as password confirmation
- 🛡️ **Security Features** - Honeypot and CAPTCHA integration options
- 📧 **Delivery Configuration** - Email notifications and webhook support

## Installation

```bash
npm install @anarchitects/forms-ts
```

`@sinclair/typebox` is installed transitively for the package runtime. Install it explicitly in your app only if you also import TypeBox helpers directly, for example `@sinclair/typebox/value`.

## Usage

```typescript
import { FormConfig, contactForm } from '@anarchitects/forms-ts';
import { schemaFromConfig } from '@anarchitects/forms-ts/builders';
import { Value } from '@sinclair/typebox/value';

// Use the predefined contact form configuration
console.log(contactForm);
// {
//   id: 'contact_default',
//   version: 1,
//   fields: [
//     { name: 'name', kind: 'string', required: true, minLength: 2, maxLength: 100, ui: { label: 'Name' } },
//     { name: 'email', kind: 'email', required: true, ui: { label: 'Email' } },
//     { name: 'message', kind: 'textarea', required: true, minLength: 10, maxLength: 3000, ui: { label: 'Message', rows: 6 } },
//     { name: 'consent', kind: 'boolean', required: true, ui: { label: 'I agree' } }
//   ],
//   security: { honeypot: 'website', captcha: 'none' },
//   delivery: { adminEmail: 'admin@site.tld', autoReply: { enabled: true, templateId: 'contact_autoreply' } }
// }

// Generate validation schema from form config
const schema = schemaFromConfig(contactForm);

// Validate form submission data
const formData = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello world! This is a test message.',
  consent: true,
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

### Using DTOs for API Integration

```typescript
import { FormDefinitionRequestDTO, SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';

// Request a form definition
const formRequest: FormDefinitionRequestDTO = {
  formId: 'contact_default',
  formVersion: 1,
};

// Submit form data
const submission: SubmissionRequestDTO = {
  formId: 'contact_default',
  formVersion: 1,
  payload: {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello world!',
    consent: true,
  },
};
```

### Security Configuration

```typescript
const secureForm: FormConfig = {
  // ... other config
  validationRules: [
    {
      kind: 'matchFields',
      sourceField: 'password',
      targetField: 'confirmPassword',
      message: 'Passwords must match.',
    },
  ],
  security: {
    honeypot: 'website', // Honeypot field name
    captcha: 'turnstile', // 'turnstile' | 'hcaptcha' | 'none'
  },
};
```

### Delivery Configuration

```typescript
const formWithDelivery: FormConfig = {
  // ... other config
  delivery: {
    adminEmail: 'admin@example.com',
    subject: 'New Contact Form Submission',
    templateId: 'contact_template',
    autoReply: {
      enabled: true,
      subject: 'Thank you for contacting us',
      templateId: 'contact_autoreply',
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
- `FieldKind` - Union of supported field types (`'string' | 'email' | 'textarea' | 'boolean' | 'select' | 'file'`)
- `FormDefinitionRequestDTO` - Request DTO for fetching form definitions
- `FormDefinitionResponseDTO` - Response DTO containing complete form configuration
- `SubmissionRequestDTO` - Request DTO for form submissions
- `SubmissionResponseDTO` - Response DTO for submission results

### Functions

- `schemaFromConfig(config: FormConfig)` - Generate TypeBox schema from form configuration

### Pre-defined Forms

- `contactForm` - Ready-to-use contact form configuration with name, email, message, and consent fields

## Exports

The library provides subpath exports for better tree-shaking:

```typescript
// Main exports (models and predefined forms)
import { FormConfig, FormField, contactForm } from '@anarchitects/forms-ts';

// Models only
import { FormField, FieldKind, FormConfig } from '@anarchitects/forms-ts/models';

// DTOs only
import { FormDefinitionRequestDTO, FormDefinitionResponseDTO, SubmissionRequestDTO, SubmissionResponseDTO } from '@anarchitects/forms-ts/dtos';

// Builders only
import { schemaFromConfig } from '@anarchitects/forms-ts/builders';
```

## Development notes

- Treat this package as the source of truth for form DTO/model contracts.
- Keep builder behavior deterministic and framework-agnostic.
- Regenerate API artifacts and verify contract tests when DTO schemas change.

## Contributing

This library is part of the [Anarchitecture Bricks](https://github.com/anarchitects/anarchitecture-bricks-3tier) monorepo. See the main repository for contribution guidelines.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
