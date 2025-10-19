import { provideHttpClient, withFetch } from '@angular/common/http';
import { Preview, applicationConfig } from '@storybook/angular';

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(withFetch())],
    }),
  ],
};
export default preview;
