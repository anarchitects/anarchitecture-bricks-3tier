import { provideHttpClient, withFetch } from '@angular/common/http';
import { setCompodocJson } from '@storybook/addon-docs/angular';
import { Preview, applicationConfig } from '@storybook/angular';
import { compodocJson } from './compodoc';

setCompodocJson(compodocJson);

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(withFetch())],
    }),
  ],
};
export default preview;
