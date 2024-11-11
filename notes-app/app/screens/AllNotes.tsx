import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { app } from '../../FirebaseConfig';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FIREBASE_AUTH } from '../../FirebaseConfig';

interface Note {
    id: string;
    title: string;
    description: string;
    imageURL?: string;
    userID: string;
    userName?: string;
}

const db = getFirestore(app);

const AllNotes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AllNotes'>>();
    const [buttonScale] = useState(new Animated.Value(1));

    useFocusEffect(
        React.useCallback(() => {
            const fetchNotes = async () => {
                try {
                    const user = FIREBASE_AUTH.currentUser;
            
                    if (user) {
                        const notesQuery = query(
                            collection(db, 'notes'),
                            where('userID', '==', user.uid) 
                        );
            
                        const querySnapshot = await getDocs(notesQuery);
                        const notesData: Note[] = querySnapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })) as Note[];
            
                        setNotes(notesData);
                    }
                } catch (error) {
                    console.error('Fehler beim Abrufen der Notizen:', error);
                }
            };
            

            fetchNotes();
        }, [])
    );

    const handlePlusButtonPressIn = () => {
        Animated.spring(buttonScale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePlusButtonPressOut = () => {
        Animated.spring(buttonScale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Notes</Text>
            <FlatList
                data={notes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.note}
                        onPress={() => navigation.navigate('EditNote', { noteId: item.id })}
                    >
                        <Text style={styles.noteTitle}>{item.title}</Text>
                        <Text style={styles.noteUser}>Erstellt von: {item.userName}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
            <TouchableOpacity
                style={[styles.addButton, { transform: [{ scale: buttonScale }] }]}
                onPress={() => navigation.navigate('CreateNote')}
                onPressIn={handlePlusButtonPressIn}
                onPressOut={handlePlusButtonPressOut}
            >
                <Animated.View style={styles.fullButtonArea}>
                    <Text style={styles.addButtonText}>+</Text>
                </Animated.View>
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
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 20,
        color: '#333',
    },
    note: {
        backgroundColor: 'white',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    noteUser: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
    },
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
        justifyContent: 'center',
    },
    fullButtonArea: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    addButtonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default AllNotes;
