import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { app, FIREBASE_AUTH } from '../../FirebaseConfig';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

interface Note {
    id: string;
    title: string;
    description: string;
    userID: string;
    userName?: string;
    sharedWith?: string[];
    category?: string; // Kategorie-ID
}

interface Category {
    id: string;
    name: string;
    color: string;
}

const db = getFirestore(app);

const AllNotes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AllNotes'>>();
    const [buttonScale] = useState(new Animated.Value(1));

    // Kategorien abrufen
    const fetchCategories = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'categories'));
            const fetchedCategories = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Category[];
            setCategories(fetchedCategories);
        } catch (error) {
            console.error('Fehler beim Abrufen der Kategorien:', error);
            Alert.alert('Fehler', 'Kategorien konnten nicht geladen werden.');
        }
    };

    // Notizen abrufen
    const fetchNotes = async () => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) {
            Alert.alert('Fehler', 'Kein angemeldeter Benutzer gefunden.');
            return;
        }

        try {
            const notesRef = collection(db, 'notes');
            const createdNotesQuery = query(
                notesRef,
                where('userID', '==', currentUser.uid)
            );

            const sharedNotesQuery = query(
                notesRef,
                where('sharedWith', 'array-contains', currentUser.uid)
            );

            const [createdNotesSnapshot, sharedNotesSnapshot] = await Promise.all([
                getDocs(createdNotesQuery),
                getDocs(sharedNotesQuery),
            ]);

            const createdNotes = createdNotesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Note[];

            const sharedNotes = sharedNotesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Note[];

            const combinedNotes = [
                ...createdNotes,
                ...sharedNotes.filter(
                    (sharedNote) =>
                        !createdNotes.some((createdNote) => createdNote.id === sharedNote.id)
                ),
            ];

            setNotes(combinedNotes);
        } catch (error) {
            console.error('Fehler beim Abrufen der Notizen:', error);
            Alert.alert('Fehler', 'Fehler beim Abrufen der Notizen.');
        }
    };

    // Beide Daten abrufen
    useEffect(() => {
        fetchCategories();
        fetchNotes();

        const unsubscribe = navigation.addListener('focus', () => {
            fetchCategories();
            fetchNotes();
        });

        return unsubscribe;
    }, [navigation]);

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

    // Kategorie finden
    const getCategoryDetails = (categoryId: string | undefined) => {
        return categories.find((category) => category.id === categoryId);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Notizen</Text>
            <FlatList
                data={notes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const category = getCategoryDetails(item.category);
                    return (
                        <TouchableOpacity
                            style={[styles.note, { borderColor: category?.color || '#ccc' }]}
                            onPress={() => navigation.navigate('EditNote', { noteId: item.id })}
                        >
                            <Text style={styles.noteTitle}>{item.title}</Text>
                            {category && (
                                <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                                    <Text style={styles.categoryText}>{category.name}</Text>
                                </View>
                            )}
                            {item.userID !== FIREBASE_AUTH.currentUser?.uid && (
                                <Text style={styles.noteUser}>
                                    Freigegeben von: {item.userName || 'Unbekannt'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />
            <Animated.View
                style={[styles.addButtonContainer, { transform: [{ scale: buttonScale }] }]}
            >
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CreateNote')}
                    onPressIn={handlePlusButtonPressIn}
                    onPressOut={handlePlusButtonPressOut}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </Animated.View>
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
        marginBottom: 10,
        color: '#333',
    },
    note: {
        backgroundColor: 'white',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: 12,
        borderRadius: 25,
        borderWidth: 1,
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
    categoryBadge: {
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    addButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
    },
    addButton: {
        backgroundColor: 'blue',
        borderRadius: 25,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    addButtonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default AllNotes;
