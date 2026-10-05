import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateTemplateDir } from './validate-template-dir';

describe('validateTemplateDir', () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(join(tmpdir(), 'mailer-validation-'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('accepts an accessible empty directory without requiring templates', () => {
    expect(() => validateTemplateDir(directory)).not.toThrow();
  });

  it('rejects a missing path with the resolved directory in the error', () => {
    const missing = join(directory, 'missing');

    expect(() => validateTemplateDir(missing)).toThrow(
      `Invalid mailer template directory "${missing}": path does not exist or cannot be accessed.`,
    );
  });

  it('rejects a file instead of a directory', () => {
    const file = join(directory, 'file');
    fs.writeFileSync(file, 'not a directory');

    expect(() => validateTemplateDir(file)).toThrow(
      `Invalid mailer template directory "${file}": path is not a directory.`,
    );
  });

  it('rejects inaccessible directories without exposing underlying error details', () => {
    // chmod-based tests depend on the OS and privileges of the test runner.
    jest.spyOn(fs, 'accessSync').mockImplementation(() => {
      throw new Error('private underlying error');
    });

    expect(() => validateTemplateDir(directory)).toThrow(
      new Error(
        `Invalid mailer template directory "${directory}": directory is not readable or searchable.`,
      ),
    );
  });
});
