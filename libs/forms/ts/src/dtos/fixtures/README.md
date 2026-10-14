# Frozen comparison fixture

`legacy-schemas.json` records exported TypeBox DTO schemas at Bricks
`268f6d46730ae8fe16816abd61c4f789666cc227`, before #489 edits. It is a test oracle,
not runtime contract authority. Do not regenerate it to accept drift. D05/D08
migration tests separately exercise the approved security changes; the old
response remains historical evidence only.
