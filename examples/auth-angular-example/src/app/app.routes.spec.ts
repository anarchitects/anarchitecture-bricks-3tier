import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { appRoutes } from './app.routes';
import { policyGuard } from '@anarchitects/auth-angular/feature';

describe('appRoutes', () => {
  const executePolicyGuard = (route: Parameters<typeof policyGuard>[0]) =>
    TestBed.runInInjectionContext(() => policyGuard(route, []));

  it('configures /admin with policyGuard and policy metadata', () => {
    const adminRoute = appRoutes.find((route) => route.path === 'admin');

    expect(adminRoute).toBeDefined();
    expect(adminRoute?.canMatch).toContain(policyGuard);
    expect(adminRoute?.data).toEqual({
      action: 'read',
      subject: 'admin-panel',
    });
  });

  it('blocks /admin when no ability is available', async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: {
            ability: jest.fn(() => undefined),
          },
        },
      ],
    }).compileComponents();

    const canMatch = executePolicyGuard({
      data: {
        action: 'read',
        subject: 'admin-panel',
      },
    } as never);

    expect(canMatch).toBe(false);
  });

  it('allows /admin when ability matches the route policy', async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: {
            ability: jest.fn(() => ({
              can: (action: string, subject: string) =>
                action === 'read' && subject === 'admin-panel',
            })),
          },
        },
      ],
    }).compileComponents();

    const canMatch = executePolicyGuard({
      data: {
        action: 'read',
        subject: 'admin-panel',
      },
    } as never);

    expect(canMatch).toBe(true);
  });
});
