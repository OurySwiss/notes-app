export const launchImageLibraryAsync = jest.fn(() =>
  Promise.resolve({
    cancelled: false,
    uri: 'mocked-image-uri',
  })
);

export const launchCameraAsync = jest.fn(() =>
  Promise.resolve({
    cancelled: false,
    uri: 'mocked-camera-uri',
  })
);
