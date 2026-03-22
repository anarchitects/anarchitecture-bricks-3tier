export default {
  displayName: 'forms-nest',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  maxWorkers: 4,
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/forms/nest',
};
