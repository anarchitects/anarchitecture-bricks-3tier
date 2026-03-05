import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';

@Component({
  standalone: true,
  selector: 'app-home',
  template: `
    <section class="home">
      <h1>Auth Angular Example</h1>
      <p>
        This app exercises all auth use cases against the Nest auth example and
        demonstrates route guarding.
      </p>

      @if (store.loading()) {
        <p class="status">Request in progress...</p>
      }

      @if (store.error(); as error) {
        <p class="status error">{{ error }}</p>
      }

      @if (store.success()) {
        <p class="status success">Last operation completed successfully.</p>
      }

      @if (store.isLoggedIn()) {
        <p class="status success">
          Logged in as {{ store.loggedInUser().email }}
        </p>
      } @else {
        <p class="status">Not logged in.</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly store = inject(AuthStore);
}
