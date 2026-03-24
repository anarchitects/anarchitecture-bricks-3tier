import { canAttemptRoutePolicy } from './route-policy';

describe('route policy matcher', () => {
  const routePolicy = { action: 'update', subject: 'Post' } as const;

  it('allows unconditional subject-level rules', () => {
    expect(
      canAttemptRoutePolicy(routePolicy, [
        { action: 'update', subject: 'Post' },
      ]),
    ).toBe(true);
  });

  it('allows conditional rules as coarse route pre-checks', () => {
    expect(
      canAttemptRoutePolicy(routePolicy, [
        {
          action: 'update',
          subject: 'Post',
          conditions: { authorId: 'user-1' },
        },
      ]),
    ).toBe(true);
  });

  it('allows field-scoped rules as coarse route pre-checks', () => {
    expect(
      canAttemptRoutePolicy(routePolicy, [
        {
          action: 'update',
          subject: 'Post',
          fields: ['title'],
        },
      ]),
    ).toBe(true);
  });

  it('denies unconditional inverted rules', () => {
    expect(
      canAttemptRoutePolicy(routePolicy, [
        {
          action: 'update',
          subject: 'Post',
          inverted: true,
        },
      ]),
    ).toBe(false);
  });

  it('ignores scoped inverted rules at the route layer', () => {
    expect(
      canAttemptRoutePolicy(routePolicy, [
        {
          action: 'update',
          subject: 'Post',
          conditions: { authorId: 'user-1' },
          inverted: true,
        },
        {
          action: 'update',
          subject: 'Post',
        },
      ]),
    ).toBe(true);
  });

  it('denies when an unconditional deny exists alongside an allow', () => {
    expect(
      canAttemptRoutePolicy(routePolicy, [
        { action: 'update', subject: 'Post' },
        { action: 'update', subject: 'Post', inverted: true },
      ]),
    ).toBe(false);
  });

  it('supports manage/all wildcard rules', () => {
    expect(
      canAttemptRoutePolicy(routePolicy, [
        {
          action: 'manage',
          subject: 'all',
        },
      ]),
    ).toBe(true);
  });

  it('fails closed for malformed rule entries', () => {
    expect(
      canAttemptRoutePolicy(routePolicy, [null] as unknown as never[]),
    ).toBe(false);
    expect(
      canAttemptRoutePolicy(routePolicy, [
        { action: 'update', subject: '' },
      ] as unknown as never[]),
    ).toBe(false);
    expect(
      canAttemptRoutePolicy(routePolicy, [
        { action: 'update', subject: 'Post', extra: true },
      ] as unknown as never[]),
    ).toBe(false);
  });

  it('fails closed for malformed route policy metadata', () => {
    expect(
      canAttemptRoutePolicy(
        { action: '', subject: 'Post' } as unknown as never,
        [{ action: 'update', subject: 'Post' }],
      ),
    ).toBe(false);
  });
});
