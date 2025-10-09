# @anarchitects/contacts-angular-data-access

Angular data-access services for the Contacts feature. This package wraps `HttpClient` calls to the Contacts API and applies the shared DTO types from `@anarchitects/contacts-ts-dtos` so frontend apps stay contract-aligned.

## Features

- 🌐 `ContactsApi` service encapsulates the `/api/contacts` endpoint.
- 🔄 Uses Angular dependency injection and strongly typed request/response models.
- 🧪 Ships with HttpClientTestingModule-based specs to lock down behaviour.

## Installation

```bash
npm install @anarchitects/contacts-angular-data-access @angular/common @angular/core
# or
yarn add @anarchitects/contacts-angular-data-access @angular/common @angular/core
```

Ensure your application imports `HttpClientModule` and depends on `@anarchitects/contacts-ts-dtos` for DTO definitions.

## Usage

```ts
import { Component, inject } from '@angular/core';
import { ContactsApi } from '@anarchitects/contacts-angular-data-access';

@Component({
  selector: 'contact-form',
  template: `<!-- form template -->`,
})
export class ContactFormComponent {
  private readonly api = inject(ContactsApi);

  submit(formValue: { name: string; email: string; message: string }) {
    this.api.createContact(formValue).subscribe(() => {
      // handle success UI
    });
  }
}
```

`createContact` returns an `Observable<ContactResponseDto>` so you can compose it with RxJS operators, global error handlers, or Angular signals.

## Nx targets (maintainers)

```bash
yarn nx build contacts-angular-data-access
yarn nx test contacts-angular-data-access
```

The build target packages the library via `@nx/angular:package`; run tests before publishing to npm to confirm API compatibility.
