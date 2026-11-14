## Fix and provenance

Target `maint/nest-11`. Link the accepted upstream fix/issue and its exact commit, or explain the maintenance-first security/bugfix and its forward-port plan. Do not merge main wholesale.

## Compatibility and semantic parity

List affected packages and their maintenance lines. Explain how the same regression and positive/negative behavior are tested on both tracks, including any implementation differences. Preserve public contracts, runtime/peer commitments, optional integrations and persistence behavior. New features and Nest 12-native migrations are ineligible.

## Validation

Record the exact candidate SHA and results for repository CI, maintenance policy, packed consumers, canonical HTTP behavior and any affected integration tests. Keep package versions unchanged; CI owns release versioning.

## Owner handoff and rollback

Identify the reviewing capability owner and the safe consumer rollback/pinning plan. Merge acceptance does not authorize publication, dist-tag changes or npm deprecation. Link separate owner release approval when it exists; otherwise say it is pending. Never rewrite an existing package tag or republish an existing version.
