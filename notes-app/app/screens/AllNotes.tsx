import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { app } from '../../FirebaseConfig';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

interface Note {
    id: string;
    title: string;
    description: string;
    imageURL?: string;
    userID?: string;
}

const db = getFirestore(app); 

const AllNotes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AllNotes'>>();

    useFocusEffect(
        React.useCallback(() => {
            const fetchNotes = async () => {
                try {
                    const querySnapshot = await getDocs(collection(db, 'notes'));
                    const notesData = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Note[];
                    setNotes(notesData);
                } catch (error) {
                    console.error('Fehler beim Abrufen der Notizen:', error);
                }
            };

            fetchNotes();
        }, [])
    );

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Alle Notizen</Text>
            <FlatList
                data={notes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.note}
                        onPress={() => navigation.navigate('EditNote', { noteId: item.id })}
                    >
                        <Text style={styles.noteTitle}>{item.title}</Text>
                        <Text>{item.description}</Text>
                    </TouchableOpacity>
                )}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('CreateNote')}
            >
                <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    note: { padding: 10, marginVertical: 8, borderColor: 'gray', borderWidth: 1, borderRadius: 5 },
    noteTitle: { fontSize: 18, fontWeight: 'bold' },
    addButton: {
        backgroundColor: 'blue',
        borderRadius: 5,
        paddingVertical: 15,
        paddingHorizontal: 20,
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default AllNotes;
