import { Route } from '@angular/router';
import {
  AnarchitectsFeatureActivateUser,
  AnarchitectsFeatureChangePassword,
  AnarchitectsFeatureForgotPassword,
  AnarchitectsFeatureLogin,
  AnarchitectsFeatureLogout,
  AnarchitectsFeatureRegister,
  AnarchitectsFeatureResetPassword,
  AnarchitectsFeatureUpdateEmail,
  AnarchitectsFeatureVerifyEmail,
} from '@anarchitects/auth-angular/feature';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'passkeys',
    loadComponent: () =>
      import('./passkeys/passkey-page/passkey-page').then((m) => m.PasskeyPage),
  },
  { path: 'login', component: AnarchitectsFeatureLogin },
  { path: 'register', component: AnarchitectsFeatureRegister },
  { path: 'activate', component: AnarchitectsFeatureActivateUser },
  { path: 'forgot-password', component: AnarchitectsFeatureForgotPassword },
  { path: 'reset-password', component: AnarchitectsFeatureResetPassword },
  { path: 'verify-email', component: AnarchitectsFeatureVerifyEmail },
  { path: 'change-password', component: AnarchitectsFeatureChangePassword },
  { path: 'update-email', component: AnarchitectsFeatureUpdateEmail },
  { path: 'logout', component: AnarchitectsFeatureLogout },
];
