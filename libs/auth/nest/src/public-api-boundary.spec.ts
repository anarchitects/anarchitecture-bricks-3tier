import * as rootEntryPoint from './index';
import * as presentationEntryPoint from './presentation';

describe('auth-nest public entrypoints', () => {
  it('keeps the root entrypoint focused on runtime composition APIs', () => {
    expect(rootEntryPoint).toHaveProperty('AuthModule');
    expect(rootEntryPoint).toHaveProperty('provideAuthRuntimeGuards');
    expect(rootEntryPoint).toHaveProperty('AuthorizedResource');

    expect(rootEntryPoint).not.toHaveProperty('Public');
    expect(rootEntryPoint).not.toHaveProperty('Policies');
    expect(rootEntryPoint).not.toHaveProperty('AuthorizeResource');
    expect(rootEntryPoint).not.toHaveProperty('RoutePolicy');
  });

  it('keeps the presentation entrypoint runtime-only', () => {
    expect(presentationEntryPoint).toHaveProperty('AuthPresentationModule');
    expect(presentationEntryPoint).toHaveProperty('AuthenticationGuard');
    expect(presentationEntryPoint).toHaveProperty('AuthorizationGuard');
    expect(presentationEntryPoint).toHaveProperty('provideAuthRuntimeGuards');
    expect(presentationEntryPoint).toHaveProperty('AuthorizedResource');

    expect(presentationEntryPoint).not.toHaveProperty('Public');
    expect(presentationEntryPoint).not.toHaveProperty('Policies');
    expect(presentationEntryPoint).not.toHaveProperty('AuthorizeResource');
    expect(presentationEntryPoint).not.toHaveProperty('RoutePolicy');
  });
});
