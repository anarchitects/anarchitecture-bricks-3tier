export default {
  displayName: 'contacts-nest-infra-persistence',
  preset: '../../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@faker-js).+', // workaround ESM module issue with @faker-js/faker and Jest
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory:
    '../../../../../coverage/libs/contacts/nest/infra/persistence',
};
