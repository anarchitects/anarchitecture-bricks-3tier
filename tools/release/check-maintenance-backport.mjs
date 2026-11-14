import { checkMaintenanceBackport } from './maintenance-backport.mjs';

try {
  console.log(
    JSON.stringify(
      checkMaintenanceBackport(process.cwd(), {
        baseRef: process.env.MAINTENANCE_BASE_REF,
        baseSha: process.env.MAINTENANCE_BASE_SHA,
        headSha: process.env.MAINTENANCE_HEAD_SHA,
        title: process.env.MAINTENANCE_PR_TITLE,
      }),
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
