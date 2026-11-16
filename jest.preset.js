const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  // Jest 30.5 loads synchronous ESM dependencies (Nest 12 and Faker) natively.
  transformIgnorePatterns: ['node_modules/'],
};
