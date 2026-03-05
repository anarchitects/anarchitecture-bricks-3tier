import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideFormsConfig } from '@anarchitects/forms-angular/config';
import { appRoutes } from './app.routes';

const formsApiBaseUrl =
  (globalThis as { __FORMS_API_BASE_URL__?: string }).__FORMS_API_BASE_URL__ ??
  'http://localhost:3000';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withFetch()),
    provideFormsConfig({
      apiBaseUrl: formsApiBaseUrl,
      apiResourcePath: 'forms',
    }),
  ],
};
