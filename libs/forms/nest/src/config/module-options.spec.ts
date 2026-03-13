import {
  mapFormsConfigToApplicationModuleOptions,
  mapFormsConfigToFormsModuleOptions,
  mapFormsConfigToMailerModuleOptions,
  mapFormsConfigToPersistenceModuleOptions,
  mapFormsConfigToPresentationModuleOptions,
} from './module-options';
import type { FormsConfig } from './forms.config';

describe('forms module option mappers', () => {
  const config: FormsConfig = {
    persistence: 'typeorm',
    mailerProvider: 'noop',
  };

  it('maps persistence options from forms config', () => {
    expect(mapFormsConfigToPersistenceModuleOptions(config)).toEqual({
      persistence: 'typeorm',
    });
  });

  it('maps mailer options from forms config', () => {
    expect(mapFormsConfigToMailerModuleOptions(config)).toEqual({
      provider: 'noop',
    });
  });

  it('maps application options from forms config', () => {
    expect(mapFormsConfigToApplicationModuleOptions(config)).toEqual({
      persistence: { persistence: 'typeorm' },
    });
  });

  it('maps presentation options from forms config', () => {
    expect(mapFormsConfigToPresentationModuleOptions(config)).toEqual({
      application: {
        persistence: { persistence: 'typeorm' },
      },
    });
  });

  it('maps root forms module options from forms config', () => {
    expect(mapFormsConfigToFormsModuleOptions(config)).toEqual({
      presentation: {
        application: {
          persistence: { persistence: 'typeorm' },
        },
      },
      mailer: {
        provider: 'noop',
      },
    });
  });
});
