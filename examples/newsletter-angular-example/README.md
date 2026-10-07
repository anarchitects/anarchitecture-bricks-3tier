# Newsletter Angular example

Run `yarn nx serve newsletter-angular-example` alongside the [Nest example](../newsletter-nest-example/README.md). The development server proxies `/api/**` to `127.0.0.1:3333`.

The signup uses `NewsletterSignupFeature`, which composes the Forms package, with component-scoped Newsletter providers and host-owned copy. Native `/confirm` and `/unsubscribe` pages submit only after an explicit button action and remove captured tokens from the address bar. They are only relevant when the backend uses the native provider.

See [Newsletter integration](../../docs/guides/newsletter-integration.md) for HTTPS mail links, deployment headers, provider selection and tests. The privacy text and consent policy are demonstration content. This app is not published as an npm package.
