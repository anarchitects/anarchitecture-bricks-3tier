type DynamicImporter = (specifier: string) => Promise<unknown>;

// Better Auth is ESM-only. Preserve native import() from this CommonJS package.
const dynamicImporter = new Function(
  'specifier',
  'return import(specifier);',
) as DynamicImporter;

export function importEsmModule<T>(specifier: string): Promise<T> {
  return dynamicImporter(specifier) as Promise<T>;
}
