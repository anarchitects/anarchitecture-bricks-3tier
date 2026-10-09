const { runProbe } = require('./out/probe.cjs');

runProbe().then(
  () => console.log('CommonJS host: DI, config, JWT and HTTP passed'),
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
