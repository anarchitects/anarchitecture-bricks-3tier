const docsPathMatchers = [
  /^docs\//,
  /^tools\/angular-docs\//,
  /^tools\/docs-hub\//,
  /^libs\/.+\/README\.md$/,
  /^README\.md$/,
  /^CONTRIBUTING\.md$/,
  /^\.github\/workflows\/docs-pages\.yml$/,
];

/** Mixed code/docs PRs keep the release semantics of their code changes. */
export function isDocsOnlyChange(files) {
  return (
    files.length > 0 &&
    files.every((filePath) =>
      docsPathMatchers.some((matcher) => matcher.test(filePath)),
    )
  );
}
