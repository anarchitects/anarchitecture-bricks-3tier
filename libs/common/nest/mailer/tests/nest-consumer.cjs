require('./out/nest-consumer.cjs')
  .runConsumer()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
