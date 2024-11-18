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
    const { getByText, getByPlaceholderText, getByTestId, getByLabelText, findByTestId } = render(<App />);

    // Sicherstellen, dass die Hauptseite angezeigt wird
    expect(getByText('Notizen')).toBeTruthy();

    // Zur CreateNote-Seite navigieren
    const addButton = getByTestId('add-note-button');
    fireEvent.press(addButton);

    await waitFor(() => expect(getByText('Neue Notiz erstellen')).toBeTruthy());

    // Titel und Beschreibung eingeben
    fireEvent.changeText(getByPlaceholderText('Titel'), 'Meine neue Notiz');
    fireEvent.changeText(getByPlaceholderText('Beschreibung'), 'Das ist eine Testbeschreibung.');

    // Kategorie auswählen
    const picker = getByTestId('category-picker');
    fireEvent(picker, 'onValueChange', 'Kategorie-ID-1'); // Beispiel-ID einer Kategorie


    // Notiz speichern
    fireEvent.press(getByText('Speichern'));

    // Erfolgsmeldung überprüfen
    await waitFor(() => {
      const successMessage = getByTestId('success-message');
      expect(successMessage).toBeTruthy();
      expect(successMessage.props.children).toBe('Notiz erfolgreich erstellt!');
    });

    // Zurück zur Notizenliste navigieren
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(3000)
    await waitFor(() => expect(getByText('Notizen')).toBeTruthy());
  });
});
