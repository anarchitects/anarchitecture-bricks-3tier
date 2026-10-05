import { accessSync, constants, statSync } from 'node:fs';

/** Validate the resolved directory before constructing the mailer. */
export function validateTemplateDir(templateDir: string): void {
  const prefix = `Invalid mailer template directory "${templateDir}"`;
  let isDirectory: boolean;

  try {
    isDirectory = statSync(templateDir).isDirectory();
  } catch {
    throw new Error(`${prefix}: path does not exist or cannot be accessed.`);
  }

  if (!isDirectory) {
    throw new Error(`${prefix}: path is not a directory.`);
  }

  try {
    accessSync(templateDir, constants.R_OK | constants.X_OK);
  } catch {
    throw new Error(`${prefix}: directory is not readable or searchable.`);
  }
}
