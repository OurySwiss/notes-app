module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|react-navigation|react-native-vector-icons|firebase|@firebase|expo-image-picker|expo-modules-core|react-native-image-picker)/)',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    '^firebase/(.*)$': '<rootDir>/__mocks__/firebase/$1',
    '^expo-image-picker$': '<rootDir>/__mocks__/expo-image-picker.js',
    '^expo-modules-core$': '<rootDir>/__mocks__/expo-modules-core.js',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
    '\\.png$': '<rootDir>/__mocks__/fileMock.js',
  },
};
