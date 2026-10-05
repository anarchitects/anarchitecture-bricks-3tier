import { isAbsolute, resolve } from 'node:path';

/** Resolve template paths without accessing the filesystem or normalizing absolute paths. */
export function resolveTemplateDir(
  templateDir: string,
  templateBaseDir?: string,
): string {
  return isAbsolute(templateDir)
    ? templateDir
    : resolve(templateBaseDir || process.cwd(), templateDir);
}
