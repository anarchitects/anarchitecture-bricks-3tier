import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';

const [jestConfigPath, testPath] = process.argv.slice(2);
const PRISM_HOST = '127.0.0.1';

if (!jestConfigPath || !testPath) {
  console.error(
    'Usage: node tools/api-specs/run-prism-jest.mjs <jestConfigPath> <testPath>',
  );
  process.exit(1);
}

const resolvedJestConfigPath = resolve(process.cwd(), jestConfigPath);
const resolvedTestPath = resolve(dirname(resolvedJestConfigPath), testPath);

let prism;

const resolvePrismPort = async () => {
  const configuredPort = process.env['PRISM_PORT'];

  if (configuredPort) {
    const parsed = Number(configuredPort);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      throw new Error(`Invalid PRISM_PORT value: "${configuredPort}"`);
    }

    return parsed;
  }

  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();

    server.unref();
    server.on('error', rejectPort);
    server.listen(0, PRISM_HOST, () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        server.close(() => {
          rejectPort(new Error('Could not resolve a free Prism port.'));
        });
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          rejectPort(error);
          return;
        }

        resolvePort(port);
      });
    });
  });
};

let ready = false;
let startupBuffer = '';

const forward = (chunk, prismBaseUrl) => {
  const message = chunk.toString();
  startupBuffer += message;
  process.stdout.write(message);

  if (message.includes('Prism is listening') || message.includes(prismBaseUrl)) {
    ready = true;
  }
};

const terminatePrism = () => {
  if (prism && !prism.killed) {
    prism.kill('SIGTERM');
  }
};

const cleanupAndExit = (code) => {
  terminatePrism();
  process.exit(code);
};

const waitForReady = async (prismBaseUrl) => {
  const timeoutAt = Date.now() + 15000;

  while (Date.now() < timeoutAt) {
    if (ready) return;

    try {
      const response = await fetch(`${prismBaseUrl}/forms/contact_default`);
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
    `Prism mock server did not start in time.\nCaptured output:\n${startupBuffer}`,
  );
};

const run = async () => {
  const prismPort = await resolvePrismPort();
  const prismBaseUrl = `http://${PRISM_HOST}:${prismPort}`;

  prism = spawn(
    'yarn',
    ['exec', 'prism', 'mock', 'docs/openapi/openapi.yaml', '-h', PRISM_HOST, '-p', String(prismPort)],
    {
      cwd: process.cwd(),
      stdio: 'pipe',
    },
  );

  prism.stdout.on('data', (chunk) => forward(chunk, prismBaseUrl));
  prism.stderr.on('data', (chunk) => {
    const message = chunk.toString();
    startupBuffer += message;
    process.stderr.write(message);

    if (
      message.includes('Prism is listening') ||
      message.includes(prismBaseUrl)
    ) {
      ready = true;
    }
  });

  process.on('SIGINT', () => cleanupAndExit(130));
  process.on('SIGTERM', () => cleanupAndExit(143));

  try {
    await waitForReady(prismBaseUrl);
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
      env: {
        ...process.env,
        PRISM_PORT: String(prismPort),
        PRISM_BASE_URL: prismBaseUrl,
      },
    },
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
