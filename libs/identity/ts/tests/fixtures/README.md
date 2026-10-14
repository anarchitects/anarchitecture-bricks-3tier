# Frozen compatibility oracle

`legacy-schemas.json` records the exported TypeBox schemas at Bricks commit
`879eec0e83f7a7125641c0ae44598be0dffa6bd1`, loaded from an isolated `git archive`
and serialized without TypeBox symbols. Auth additionally records factory output
for password minima 3, 6 and 10, with the strict profile requiring a name.

These fixtures detect regressions during canonical adoption. They are not a
source for runtime schemas, wire changes or canonical contract approval. Do not
regenerate them to make a failing compatibility comparison pass.
