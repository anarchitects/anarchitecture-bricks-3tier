import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const [jestConfigPath, testPath] = process.argv.slice(2);

if (!jestConfigPath || !testPath) {
  console.error(
    'Usage: node tools/api-specs/run-prism-jest.mjs <jestConfigPath> <testPath>'
  );
  process.exit(1);
}

const resolvedJestConfigPath = resolve(process.cwd(), jestConfigPath);
const resolvedTestPath = resolve(
  dirname(resolvedJestConfigPath),
  testPath
);

const prism = spawn(
  'yarn',
  ['exec', 'prism', 'mock', 'docs/openapi/openapi.yaml', '-p', '4010'],
  {
    cwd: process.cwd(),
    stdio: 'pipe',
  }
);

let ready = false;
let startupBuffer = '';

const forward = (chunk) => {
  const message = chunk.toString();
  startupBuffer += message;
  process.stdout.write(message);

  if (message.includes('Prism is listening') || message.includes('http://127.0.0.1:4010')) {
    ready = true;
  }
};

prism.stdout.on('data', forward);
prism.stderr.on('data', (chunk) => {
  const message = chunk.toString();
  startupBuffer += message;
  process.stderr.write(message);

  if (message.includes('Prism is listening') || message.includes('http://127.0.0.1:4010')) {
    ready = true;
  }
});

const terminatePrism = () => {
  if (!prism.killed) {
    prism.kill('SIGTERM');
  }
};

const cleanupAndExit = (code) => {
  terminatePrism();
  process.exit(code);
};

const waitForReady = async () => {
  const timeoutAt = Date.now() + 15000;

  while (Date.now() < timeoutAt) {
    if (ready) return;

    try {
      const response = await fetch('http://127.0.0.1:4010/forms/contact_default');
      if (response.status < 500) {
        ready = true;
        return;
      }
    } catch {
      // Ignore until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(
    `Prism mock server did not start in time.\nCaptured output:\n${startupBuffer}`
  );
};

const run = async () => {
  process.on('SIGINT', () => cleanupAndExit(130));
  process.on('SIGTERM', () => cleanupAndExit(143));

  try {
    await waitForReady();
  } catch (error) {
    console.error(error);
    cleanupAndExit(1);
    return;
  }

  const jestProcess = spawn(
    'yarn',
    [
      'jest',
      '--config',
      resolvedJestConfigPath,
      '--runTestsByPath',
      resolvedTestPath,
    ],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
    }
  );

  jestProcess.on('exit', (code) => {
    terminatePrism();
    process.exit(code ?? 1);
  });
};

run().catch((error) => {
  console.error(error);
  cleanupAndExit(1);
});
