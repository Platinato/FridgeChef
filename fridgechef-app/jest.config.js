/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Reanimated 4: resolve the non-native (JS) worklets implementation under Jest.
  resolver: 'react-native-worklets/jest/resolver',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation|react-native-svg)',
  ],
  // Mirrors the tsconfig `paths`; the more specific alias must come first.
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.verify-dist/', '/dist/'],
};
