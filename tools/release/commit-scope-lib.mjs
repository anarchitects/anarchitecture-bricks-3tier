export function validateCommitScope(subject, projectNames, typeNames) {
  const match = /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s+.+$/.exec(subject);
  if (!match) return 'Use a Conventional Commit subject';
  const [, type, scope] = match;
  if (!typeNames.has(type)) return `Unknown Conventional Commit type: ${type}`;
  if (scope && !projectNames.has(scope))
    return `Scope "${scope}" is not an exact Nx project name`;
  return null;
}
