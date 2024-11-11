import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { app } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc, getFirestore } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type EditNoteScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditNote'>;
type EditNoteScreenRouteProp = RouteProp<RootStackParamList, 'EditNote'>;

interface Props {
    navigation: EditNoteScreenNavigationProp;
    route: EditNoteScreenRouteProp;
}
const db = getFirestore(app); 

const EditNote: React.FC<Props> = ({ route, navigation }) => {
    const { noteId } = route.params;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const noteRef = doc(db, 'notes', noteId);
                const noteSnap = await getDoc(noteRef);
                if (noteSnap.exists()) {
                    const noteData = noteSnap.data();
                    setTitle(noteData.title);
                    setDescription(noteData.description);
                } else {
                    setMessage('Notiz nicht gefunden.');
                }
            } catch (error) {
                console.error('Fehler beim Laden der Notiz:', error);
                setMessage('Fehler beim Laden der Notiz.');
            }
        };
        fetchNote();
    }, [noteId]);

    const handleSave = async () => {
        try {
            const noteRef = doc(db, 'notes', noteId);
            await updateDoc(noteRef, {
                title: title,
                description: description,
            });
            setMessage('Notiz erfolgreich aktualisiert!');
            navigation.goBack();
        } catch (error) {
            console.error('Fehler beim Speichern der Notiz:', error);
            setMessage('Fehler beim Speichern der Notiz.');
        }
    };

    const handleDelete = async () => {
        try {
            const noteRef = doc(db, 'notes', noteId);
            await deleteDoc(noteRef);
            setMessage('Notiz erfolgreich gelöscht!');
            navigation.goBack();
        } catch (error) {
            console.error('Fehler beim Löschen der Notiz:', error);
            setMessage('Fehler beim Löschen der Notiz.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Notiz Bearbeiten</Text>
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
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.buttonTextWhite}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#f7f7f7', flex: 1 },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    input: { 
        backgroundColor: '#eaeaea',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    textArea: { 
        height: 150, 
        textAlignVertical: 'top',
    },
    message: {
        color: '#555',
        fontSize: 14,
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    deleteButton: {
        backgroundColor: 'white',
        borderColor: 'blue',
        borderWidth: 1,
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    saveButton: {
        backgroundColor: 'blue',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        flex: 1,
    },
    buttonText: {
        color: 'blue',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonTextWhite: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EditNote;
