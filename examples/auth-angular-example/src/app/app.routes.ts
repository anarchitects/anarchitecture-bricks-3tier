import { Routes } from '@angular/router';
import {
  AnarchitectsFeatureActivateUser,
  AnarchitectsFeatureChangePassword,
  AnarchitectsFeatureForgotPassword,
  AnarchitectsFeatureLogin,
  AnarchitectsFeatureLogout,
  AnarchitectsFeatureRefreshTokens,
  AnarchitectsFeatureRegister,
  AnarchitectsFeatureResetPassword,
  AnarchitectsFeatureUpdateEmail,
  AnarchitectsFeatureVerifyEmail,
  policyGuard,
} from '@anarchitects/auth-angular/feature';
import { AdminComponent } from './admin.component';
import { HomeComponent } from './home.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'register',
    component: AnarchitectsFeatureRegister,
  },
  {
    path: 'activate',
    component: AnarchitectsFeatureActivateUser,
  },
  {
    path: 'activate/:token',
    component: AnarchitectsFeatureActivateUser,
  },
  {
    path: 'login',
    component: AnarchitectsFeatureLogin,
  },
  {
    path: 'logout',
    component: AnarchitectsFeatureLogout,
  },
  {
    path: 'forgot-password',
    component: AnarchitectsFeatureForgotPassword,
  },
  {
    path: 'reset-password',
    component: AnarchitectsFeatureResetPassword,
  },
  {
    path: 'reset-password/:token',
    component: AnarchitectsFeatureResetPassword,
  },
  {
    path: 'verify-email',
    component: AnarchitectsFeatureVerifyEmail,
  },
  {
    path: 'verify-email/:token',
    component: AnarchitectsFeatureVerifyEmail,
  },
  {
    path: 'change-password',
    component: AnarchitectsFeatureChangePassword,
  },
  {
    path: 'change-password/:userId',
    component: AnarchitectsFeatureChangePassword,
  },
  {
    path: 'update-email',
    component: AnarchitectsFeatureUpdateEmail,
  },
  {
    path: 'update-email/:userId',
    component: AnarchitectsFeatureUpdateEmail,
  },
  {
    path: 'refresh-tokens',
    component: AnarchitectsFeatureRefreshTokens,
  },
  {
    path: 'refresh-tokens/:userId',
    component: AnarchitectsFeatureRefreshTokens,
  },
  {
    path: 'admin',
    canMatch: [policyGuard],
    data: {
      action: 'read',
      subject: 'admin-panel',
    },
    component: AdminComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
