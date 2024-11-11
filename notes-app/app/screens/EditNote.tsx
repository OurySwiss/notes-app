import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, FlatList } from 'react-native';
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
    const [imageURLs, setImageURLs] = useState<string[]>([]);
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
                    setImageURLs(noteData.imageURL || []);
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
            {/* Bilder unter der Beschreibung anzeigen */}
            <FlatList
                data={imageURLs}
                keyExtractor={(url, index) => index.toString()}
                renderItem={({ item: url }) => (
                    <Image source={{ uri: url }} style={styles.image} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageContainer}
            />
            {message ? <Text>{message}</Text> : null}
            <View style={styles.buttonContainer}>
                <Button title="Delete" onPress={handleDelete} color="red" />
                <Button title="Save" onPress={handleSave} color="blue" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 8 },
    textArea: { height: 100, textAlignVertical: 'top' },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    imageContainer: {
        marginTop: 10,
        flexDirection: 'row',
    },
    image: {
        width: 80,
        height: 80,
        marginRight: 10,
        borderRadius: 5,
    },
});

export default EditNote;
