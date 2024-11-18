import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../../App';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'test-user', displayName: 'Test User' });
  }),
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-user', displayName: 'Test User' },
  })),
}));

describe('AllNotes to CreateNote Workflow', () => {
  it('öffnet die CreateNote-Seite und erstellt eine neue Notiz', async () => {
    const { getByText, getByPlaceholderText, getByTestId, findByTestId } = render(<App />);

    expect(getByText('Notizen')).toBeTruthy();

    const addButton = getByTestId('add-note-button');
    fireEvent.press(addButton);

    await waitFor(() => expect(getByText('Neue Notiz erstellen')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Titel'), 'Meine neue Notiz');
    fireEvent.changeText(getByPlaceholderText('Beschreibung'), 'Das ist eine Testbeschreibung.');

    fireEvent.press(getByText('Speichern'));

    await waitFor(() => {
        const successMessage = getByTestId('success-message');
        expect(successMessage).toBeTruthy();
        expect(successMessage.props.children).toBe('Notiz erfolgreich erstellt!');
    });

    await waitFor(() => expect(getByText('Notizen')).toBeTruthy());
  });
});
