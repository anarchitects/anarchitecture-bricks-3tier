// ADR-0010: Newsletter may consume Common, but remains independent of other
// business domains. Host applications and documentation may compose the brick.
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
        if (
          !targetTags.some((tag) =>
            ['domain:newsletter', 'domain:shared'].includes(tag),
          )
        ) {
          errors.push(
            `${source} -> ${target}: Newsletter may only depend on Newsletter or Common.`,
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
