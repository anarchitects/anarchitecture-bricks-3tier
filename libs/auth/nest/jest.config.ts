export default {
  displayName: 'auth-nest',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  maxWorkers: '50%',
  testPathIgnorePatterns: ['<rootDir>/src/integration/'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/auth/nest',
};
