# PostgreSQL compatibility validation

Reusable bricks are not restricted to the application server's PostgreSQL 16 line. The packed Nest compatibility workflow keeps all existing Node/Nest lanes on PostgreSQL 16 and additionally runs both Nest 11 and Nest 12 suites against PostgreSQL 17 and 18 on consumer Node 24.11.0. Auth, Forms/Identity and Newsletter use real, isolated Testcontainers databases. Existing HTTP, persistence, migration, lifecycle and negative assertions remain active.

`POSTGRES_TEST_IMAGE` selects the database image for these three packed-host runners; the local default remains `postgres:16-alpine`. For example:

```sh
POSTGRES_TEST_IMAGE=postgres:18-alpine yarn nx run release-tools:test-nest-compatibility:nest12 --skip-nx-cache
```

The PostgreSQL major is included in CI job and evidence artifact names. Each run creates fresh databases; existing application volumes are never migrated. These lanes test the current packed artifacts and locked consumers, not every Node/database/driver combination. Review the actual PR checks before claiming compatibility. Other focused persistence/passkey targets retain their existing defaults.

This adds verification only. It does not change Nest defaults, public peer ranges, package versions, contract ownership or release authorization. See [packed Nest release validation](nest-release-validation.md) and accepted ADRs 0011 and 0016 for retained compatibility and contract gates.
