import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { RootStackParamList } from '../types'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const db = getFirestore();

const CreateNote: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handleSaveNote = async () => {
        const user = FIREBASE_AUTH.currentUser;
        const userName = user?.displayName || 'Unknown User';

        try {
            await addDoc(collection(db, 'notes'), {
                title,
                description,
                userID: user?.uid,
                userName: userName, 
            });
            navigation.navigate('Inside');
        } catch (error) {
            console.error('Fehler beim Erstellen der Notiz:', error);
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
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveNote}>
                <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
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
        color: '#333',
    },
    input: {
        backgroundColor: 'white',
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: 'blue', // Gleiche blaue Farbe wie der Add-Button
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
});

export default CreateNote;
