import {
  HttpBackend,
  HttpXhrBackend,
  provideHttpClient,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideFormsConfig } from '@anarchitects/forms-angular/config';
import { FormsApi } from '@anarchitects/forms-angular/data-access';
import { firstValueFrom } from 'rxjs';

const prismBaseUrl = process.env['PRISM_BASE_URL'] ?? 'http://127.0.0.1:4010';

describe('forms Angular consumer contract', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        FormsApi,
        provideHttpClient(),
        { provide: HttpBackend, useClass: HttpXhrBackend },
        provideFormsConfig({
          apiBaseUrl: prismBaseUrl,
          apiResourcePath: 'forms',
        }),
      ],
    }).compileComponents();
  });

  it('reads the documented form envelope', async () => {
    const response = await firstValueFrom(
      TestBed.inject(FormsApi).getDefinition('contact_default'),
    );
    expect(response).toHaveProperty('config');
    expect(response).toHaveProperty('schema');
  });

  it('submits the documented form payload', async () => {
    const response = await firstValueFrom(
      TestBed.inject(FormsApi).submitForm({
        formId: 'contact_default',
        formVersion: 1,
        payload: {
          name: 'Doc User',
          email: 'doc@example.com',
          message: 'Hello',
        },
      }),
    );
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('formId');
  });
});
