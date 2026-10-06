// ADR-0010: Newsletter may consume Common, but remains independent of other
// business domains except Forms UI reuse. ESLint narrows that package edge to
// UI renderer/contracts; host applications and documentation may compose the brick.
export function newsletterBoundaryViolations(graph) {
  const tags = (name) => graph.nodes?.[name]?.data?.tags ?? [];
  const errors = [];

  for (const [source, dependencies] of Object.entries(
    graph.dependencies ?? {},
  )) {
    const sourceNode = graph.nodes?.[source];
    if (
      sourceNode?.type === 'app' ||
      sourceNode?.data?.root?.startsWith('examples/')
    )
      continue;
    const sourceTags = tags(source);
    for (const { target } of dependencies) {
      if (!graph.nodes?.[target]) continue; // External npm dependency.
      const targetTags = tags(target);
      if (sourceTags.includes('domain:newsletter')) {
        const formsPresentation =
          source === 'newsletter-angular' &&
          ['forms-angular', 'forms-ts'].includes(target);
        if (
          !formsPresentation &&
          !targetTags.some((tag) =>
            ['domain:newsletter', 'domain:shared'].includes(tag),
          )
        ) {
          errors.push(
            `${source} -> ${target}: Newsletter may only depend on Newsletter, Common, or the approved Forms UI packages.`,
          );
        }
      } else if (
        targetTags.includes('domain:newsletter') &&
        sourceTags.some((tag) =>
          [
            'domain:blog',
            'domain:forms',
            'domain:auth',
            'domain:identity',
            'domain:shared',
          ].includes(tag),
        )
      ) {
        errors.push(
          `${source} -> ${target}: business domains and Common must not depend on Newsletter; compose it in the host.`,
        );
      }
    }
  }

  return errors;
}
