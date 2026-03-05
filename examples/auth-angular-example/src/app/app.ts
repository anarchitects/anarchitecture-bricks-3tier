import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '@anarchitects/auth-angular/state';

@Component({
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly store = inject(AuthStore);

  readonly links = [
    { path: '/', label: 'Home' },
    { path: '/register', label: 'Register' },
    { path: '/activate', label: 'Activate' },
    { path: '/login', label: 'Login' },
    { path: '/logout', label: 'Logout' },
    { path: '/forgot-password', label: 'Forgot' },
    { path: '/reset-password', label: 'Reset' },
    { path: '/verify-email', label: 'Verify Email' },
    { path: '/change-password', label: 'Change Password' },
    { path: '/update-email', label: 'Update Email' },
    { path: '/refresh-tokens', label: 'Refresh Tokens' },
    { path: '/admin', label: 'Admin (Guarded)' },
  ];
}
