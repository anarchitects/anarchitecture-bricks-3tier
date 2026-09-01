import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  provideAuthConfig,
  provideAuthContracts,
} from '@anarchitects/auth-angular/config';
import { provideAuthState } from '@anarchitects/auth-angular/state';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(appRoutes),
    provideAuthConfig({ apiResourcePath: 'auth' }),
    provideAuthContracts(),
    provideAuthState({ restoreOnInit: false }),
  ],
};
