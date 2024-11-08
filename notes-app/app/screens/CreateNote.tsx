import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app, FIREBASE_AUTH } from '../../FirebaseConfig'; 
const db = getFirestore(app); 

const CreateNote = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageURL, setImageURL] = useState('');
    const [userID, setUserID] = useState(''); 
    const [message, setMessage] = useState('');

    const handleCreateNote = async () => {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) {
        setMessage('Kein Nutzer angemeldet. Bitte logge dich ein.');
        return;
    }
        if (title && description) {
            try {
                await addDoc(collection(db, 'notes'), {
                    title: title,
                    description: description,
                    imageURL: imageURL,
                    userID: user.uid, 
                    createdAt: new Date(),
                });
                setMessage('Notiz erfolgreich erstellt!');
                setTitle('');
                setDescription('');
                setImageURL('');
                setUserID('');
            } catch (error) {
                console.error('Fehler beim Erstellen der Notiz: ', error);
                setMessage('Fehler beim Erstellen der Notiz.');
            }
        } else {
            setMessage('Bitte Titel und Beschreibung eingeben.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Neue Notiz erstellen</Text>
            <TextInput
                style={styles.input}
                placeholder="Titel"
                value={title}
                onChangeText={setTitle}
            />
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Beschreibung"
                value={description}
                onChangeText={setDescription}
                multiline
            />
            <TextInput
                style={styles.input}
                placeholder="Bild-URL"
                value={imageURL}
                onChangeText={setImageURL}
            />
            <Button title="Notiz erstellen" onPress={handleCreateNote} />
            {message ? <Text>{message}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 8 },
    textArea: { height: 100, textAlignVertical: 'top' },
});

export default CreateNote;
