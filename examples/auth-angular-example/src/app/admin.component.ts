import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';

@Component({
  standalone: true,
  selector: 'app-admin',
  template: `
    <section class="admin">
      <h1>Admin Console</h1>
      <p>Protected route reached through <code>policyGuard</code>.</p>
      <p>Current user: {{ store.loggedInUser().email }}</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  readonly store = inject(AuthStore);
}
