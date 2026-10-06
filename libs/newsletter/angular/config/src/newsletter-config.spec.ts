import {
  resolveNewsletterConfig,
  type NewsletterConfig,
} from './newsletter-config';

const consent = { version: 'host/v1', text: 'Host wording' };
describe('Newsletter config', () => {
  it.each([
    [undefined, undefined, '/newsletter/subscribe'],
    ['/api/', '/newsletter/', '/api/newsletter/subscribe'],
    [
      'https://api.example.test/v2///',
      'marketing/news',
      'https://api.example.test/v2/marketing/news/subscribe',
    ],
    ['/', 'newsletter', '/newsletter/subscribe'],
  ])(
    'resolves the configured endpoint %s %s',
    (apiBaseUrl, apiResourcePath, expected) => {
      expect(
        resolveNewsletterConfig({ consent, apiBaseUrl, apiResourcePath })
          .subscriptionUrl,
      ).toBe(expected);
    },
  );
  it('snapshots host policy without changing whitespace or providing legal defaults', () => {
    const policy = { version: ' v1 ', text: ' Exact wording. ' };
    const config = resolveNewsletterConfig({ consent: policy });
    policy.text = 'later';
    expect(config.consent).toEqual({
      version: ' v1 ',
      text: ' Exact wording. ',
    });
    expect(Object.isFrozen(config.consent)).toBe(true);
    expect(Object.isFrozen(config)).toBe(true);
    expect(config.requestTimeoutMs).toBe(10000);
  });
  it.each([
    {},
    { consent: { version: '', text: 'wording' } },
    { consent: { version: 'v', text: ' ' } },
    { apiBaseUrl: '//other.test' },
    { apiBaseUrl: 'javascript:invalid' },
    { apiBaseUrl: 'api' },
    { apiBaseUrl: 'https://user:secret@api.test' },
    { apiBaseUrl: '/api?email=x' },
    { apiBaseUrl: '/api#fragment' },
    { apiBaseUrl: '/api\n' },
    { apiResourcePath: '../newsletter' },
    { apiResourcePath: '' },
    { apiResourcePath: 'newsletter\n' },
    { requestTimeoutMs: 0 },
    { requestTimeoutMs: 1.5 },
    { requestTimeoutMs: 2147483648 },
  ])('rejects invalid configuration %j', (patch) => {
    const config = Object.keys(patch).length ? { consent, ...patch } : {};
    expect(() => resolveNewsletterConfig(config as NewsletterConfig)).toThrow(
      'Invalid Newsletter client configuration.',
    );
  });
});
