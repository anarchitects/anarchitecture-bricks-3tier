# Frozen comparison fixture

`legacy-schemas.json` records exported Newsletter TypeBox schemas at Bricks
`268f6d46730ae8fe16816abd61c4f789666cc227`, before #489. It is a test-only oracle,
not runtime authority. Keep it immutable; the differential suite compares the
published canonical parser and derived bindings, including UTF-16 boundaries.
