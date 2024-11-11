import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app, FIREBASE_AUTH } from '../../FirebaseConfig';
import { launchImageLibrary, PhotoQuality } from 'react-native-image-picker';

const db = getFirestore(app);

const CreateNote = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageURLs, setImageURLs] = useState<string[]>([]);
    const [userID, setUserID] = useState('');
    const [message, setMessage] = useState('');

    const handleImagePicker = () => {
    const options = {
        mediaType: 'photo' as const,
        quality: 1 as PhotoQuality,
        selectionLimit: 0,
    };

    launchImageLibrary(options, (response) => {
        if (response.didCancel) {
            console.log('User cancelled image picker');
        } else if (response.errorCode) {
            console.log('ImagePicker Error: ', response.errorCode);
        } else if (response.assets) {
            const newImageURLs = response.assets
                .filter((asset) => asset.uri)
                .map((asset) => asset.uri as string);
            setImageURLs((prev) => [...prev, ...newImageURLs]);
        }
    });
};



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
                    imageURL: imageURLs,
                    userID: user.uid,
                    createdAt: new Date(),
                });
                setMessage('Notiz erfolgreich erstellt!');
                setTitle('');
                setDescription('');
                setImageURLs([]);
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
            <Button title="Add Image" onPress={handleImagePicker} />
            <View style={styles.imageContainer}>
                {imageURLs.map((url, index) => (
                    <Image key={index} source={{ uri: url }} style={styles.image} />
                ))}
            </View>
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
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 10,
    },
    image: {
        width: 100,
        height: 100,
        marginRight: 10,
        marginBottom: 10,
        borderRadius: 8,
    },
});

export default CreateNote;
