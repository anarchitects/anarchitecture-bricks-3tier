# Contracts

- `openapi.yaml` is the source of truth for sync APIs.
- Generate JSON Schemas: `yarn contracts:gen:schemas`
- Generate TS client: `yarn contracts:gen:ts-web`
- Run mock server: `yarn nx run contracts:mock`
- Compare against main: `yarn nx run contracts:diff`
	- Override the base ref: `yarn nx run contracts:diff -- my-feature` (defaults to `origin/main`)
- Document intentional breaking changes in PRs.
