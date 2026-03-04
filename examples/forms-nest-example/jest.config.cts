module.exports = {
  displayName: 'forms-nest-example',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/src/contract/', '/node_modules/'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/examples/forms-nest-example'
};
