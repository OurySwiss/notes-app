import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { app } from '../../FirebaseConfig';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

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

    useEffect(() => {
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
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Alle Notizen</Text>
            <FlatList
                data={notes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.note}>
                        <Text style={styles.noteTitle}>{item.title}</Text>
                        <Text>{item.description}</Text>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    note: {
        padding: 10,
        marginVertical: 8,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
    },
    noteTitle: { fontSize: 18, fontWeight: 'bold' },
});

export default AllNotes;
