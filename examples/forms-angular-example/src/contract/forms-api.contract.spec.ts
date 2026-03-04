import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FormsApi } from '@anarchitects/forms-angular/data-access';
import { provideFormsConfig } from '@anarchitects/forms-angular/config';

describe('forms-angular-example contract (Prism)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        FormsApi,
        provideHttpClient(),
        ...provideFormsConfig({
          apiBaseUrl: 'http://127.0.0.1:4010',
          apiResourcePath: 'forms',
        }),
      ],
    }).compileComponents();
  });

  it('GET /forms/{formId} returns documented envelope', async () => {
    const api = TestBed.inject(FormsApi);
    const response = await firstValueFrom(api.getDefinition('contact_default'));

    expect(response).toHaveProperty('config');
    expect(response).toHaveProperty('schema');
  });

  it('POST /forms/submit returns documented submission payload', async () => {
    const api = TestBed.inject(FormsApi);
    const response = await firstValueFrom(
      api.submitForm({
        formId: 'contact_default',
        formVersion: 1,
        payload: {
          name: 'Doc User',
          email: 'doc@example.com',
          message: 'From angular contract test',
        },
      })
    );

    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('formId');
    expect(response).toHaveProperty('createdAt');
  });
});
