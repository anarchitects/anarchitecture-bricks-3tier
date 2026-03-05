import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { withAuthHttpInterceptors } from '@anarchitects/auth-angular/data-access';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withAuthHttpInterceptors()),
    ...provideAuthConfig({
      apiResourcePath: 'auth',
    }),
  ],
};
