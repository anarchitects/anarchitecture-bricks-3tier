import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'anarchitects-forms-ui-submitted',
  imports: [],
  templateUrl: './submitted.html',
  styleUrl: './submitted.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFormsUiSubmitted {
  message = input<string>('Form submitted successfully!');
}
