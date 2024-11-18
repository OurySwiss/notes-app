export const onAuthStateChanged = jest.fn((auth, callback) => {
  // Simuliere einen angemeldeten Benutzer
  callback({ uid: 'test-user', displayName: 'Test User' });
});

export const getAuth = jest.fn(() => ({}));

// Optional: Mock für `currentUser`
export const FIREBASE_AUTH = {
  currentUser: { uid: 'test-user', displayName: 'Test User' },
};

export const signOut = jest.fn(() => Promise.resolve());
