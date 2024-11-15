import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app, FIREBASE_AUTH } from '../../FirebaseConfig';
import { launchImageLibrary, PhotoQuality } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const db = getFirestore(app);

const CreateNote: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageURLs, setImageURLs] = useState<string[]>([]);
    const [message, setMessage] = useState('');

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

    const handleSaveNote = async () => {
        const user = FIREBASE_AUTH.currentUser;
        const userName = user?.displayName || 'Unknown User';

        if (!user) {
            setMessage('Kein Nutzer angemeldet. Bitte logge dich ein.');
            return;
        }

        if (title && description) {
            try {
                await addDoc(collection(db, 'notes'), {
                    title,
                    description,
                    imageURL: imageURLs,
                    userID: user?.uid,
                    userName: userName, 
                });
                setMessage('Notiz erfolgreich erstellt!');
                setTitle('');
                setDescription('');
                setImageURLs([]);
                navigation.navigate('Inside'); // Nach dem Speichern weiterleiten
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
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveNote}>
                <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
            {message ? <Text>{message}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 16, 
        backgroundColor: '#f7f7f7',
    },
    heading: { 
        fontSize: 24, 
        fontWeight: '700', 
        marginBottom: 20, 
        color: '#333' 
    },
    input: { 
        backgroundColor: 'white', 
        padding: 10, 
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 8, 
        marginBottom: 12 
    },
    textArea: { 
        height: 100, 
        textAlignVertical: 'top' 
    },
    saveButton: {
        backgroundColor: 'blue', 
        borderRadius: 5, 
        paddingVertical: 15, 
        alignItems: 'center', 
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white', 
        fontSize: 18, 
        fontWeight: 'bold',
    },
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