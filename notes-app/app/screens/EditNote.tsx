import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { app, FIREBASE_AUTH } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc, getFirestore, arrayUnion, collection, query, where, getDocs, arrayRemove } from 'firebase/firestore';
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
    const [shareUsername, setShareUsername] = useState('');
    const [message, setMessage] = useState('');
    const [sharedWith, setSharedWith] = useState<{ uid: string, username: string }[]>([]);

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const noteRef = doc(db, 'notes', noteId);
                const noteSnap = await getDoc(noteRef);
                if (noteSnap.exists()) {
                    const noteData = noteSnap.data();
                    setTitle(noteData.title);
                    setDescription(noteData.description);
                    await loadSharedUsers(noteData.sharedWith || []);
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

    const loadSharedUsers = async (sharedUIDs: string[]) => {
        try {
            if (sharedUIDs.length === 0) {
                setSharedWith([]);
                return;
            }
    
            const usersRef = collection(db, 'userProfile');
            const usersQuery = query(usersRef, where('uid', 'in', sharedUIDs));
            const usersSnapshot = await getDocs(usersQuery);
            const usersData = usersSnapshot.docs.map(doc => ({
                uid: doc.data().uid,
                username: doc.data().username,
            }));
            setSharedWith(usersData);
        } catch (error) {
            console.error('Fehler beim Laden der Benutzernamen:', error);
        }
    };

    const handleSave = async () => {
        try {
            const noteRef = doc(db, 'notes', noteId);
            await updateDoc(noteRef, {
                title,
                description,
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

    const handleShareNote = async () => {
        if (!shareUsername) {
            Alert.alert("Fehler", "Bitte geben Sie einen Benutzernamen ein.");
            return;
        }

        try {
            const usersRef = collection(db, 'userProfile');
            const q = query(usersRef, where('username', '==', shareUsername));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userIdToShare = userDoc.data().uid;

                const noteRef = doc(db, 'notes', noteId);
                await updateDoc(noteRef, {
                    sharedWith: arrayUnion(userIdToShare),
                });

                setSharedWith(prev => [...prev, { uid: userIdToShare, username: shareUsername }]);
                Alert.alert("Erfolg", `Notiz erfolgreich für ${shareUsername} freigegeben.`);
                setShareUsername('');
            } else {
                Alert.alert("Fehler", "Benutzername nicht gefunden.");
            }
        } catch (error) {
            console.error("Fehler beim Teilen der Notiz:", error);
            Alert.alert("Fehler", "Fehler beim Teilen der Notiz.");
        }
    };

    const removeSharedUser = async (userId: string) => {
        try {
            const noteRef = doc(db, 'notes', noteId);
            await updateDoc(noteRef, {
                sharedWith: arrayRemove(userId),
            });
            setSharedWith(prev => prev.filter(user => user.uid !== userId));
            Alert.alert("Erfolg", "Benutzer wurde entfernt.");
        } catch (error) {
            console.error('Fehler beim Entfernen des Benutzers:', error);
            Alert.alert("Fehler", "Benutzer konnte nicht entfernt werden.");
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
            <Text style={styles.shareHeading1}>Notiz teilen</Text>

            {sharedWith.length > 0 && (
    <>
        <Text style={styles.shareHeading2}>Geteilt mit:</Text>
        <FlatList
            style={styles.sharedUsersList}
            data={sharedWith}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
                <View style={styles.sharedUserContainer}>
                    <Text style={styles.sharedUserText}>{item.username}</Text>
                    <TouchableOpacity onPress={() => removeSharedUser(item.uid)} style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                </View>
            )}
        />
    </>
)}
            <TextInput
                style={styles.input}
                placeholder="Benutzername eingeben"
                value={shareUsername}
                onChangeText={setShareUsername}
            />
            <TouchableOpacity style={styles.shareButton} onPress={handleShareNote}>
                <Text style={styles.buttonTextWhite}>Teilen</Text>
            </TouchableOpacity>

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
    heading: { fontSize: 25, fontWeight: 'bold', marginBottom: 20, color: '#333' },
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
    shareHeading1: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 30,
        color: '#333',
        textDecorationLine: 'underline',
        marginBottom: 18,
    },
    shareHeading2: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 30,
        color: '#333',
    },
    shareButton: {
        backgroundColor: 'blue',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    sharedUserContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 8,
        width: '100%',
    },
    sharedUserText: {
        fontSize: 16,
        color: '#333',
    },
    removeButton: {
        backgroundColor: 'red',
        borderRadius: 5,
        padding: 5,
    },
    removeButtonText: {
        color: 'white',
        fontWeight: 'bold',
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
    sharedUsersList: {
        marginBottom: 20,
    },
});

export default EditNote;
