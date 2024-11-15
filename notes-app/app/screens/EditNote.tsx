import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Modal, Image } from 'react-native';
import { app, FIREBASE_AUTH } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc, getFirestore, arrayUnion, collection, query, where, getDocs, arrayRemove } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { launchImageLibrary, PhotoQuality } from 'react-native-image-picker';

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
    const [shareUsername, setShareUsername] = useState('');
    const [message, setMessage] = useState('');
    const [sharedWith, setSharedWith] = useState<{ uid: string, username: string }[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

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
                imageURL: imageURLs,
            });
            setMessage('Notiz erfolgreich aktualisiert!');
            navigation.goBack();
        } catch (error) {
            console.error('Fehler beim Speichern der Notiz:', error);
            setMessage('Fehler beim Speichern der Notiz.');
        }
    };

    const handleDelete = () => {
        setModalVisible(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const noteRef = doc(db, 'notes', noteId); 
            await deleteDoc(noteRef); 
            setMessage('Notiz erfolgreich gelöscht!');
            setModalVisible(false);
            navigation.goBack(); 
        } catch (error) {
            console.error('Fehler beim Löschen der Notiz:', error);
            setMessage('Fehler beim Löschen der Notiz.');
            setModalVisible(false); 
        }
    };

    const handleCancelDelete = () => {
        setModalVisible(false);
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
            <Button title="Add Image" onPress={handleImagePicker} />
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCancelDelete}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Möchten Sie diese Notiz wirklich löschen?</Text>
                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleCancelDelete}
                            >
                                <Text style={styles.modalButtonText}>Abbrechen</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleConfirmDelete}
                            >
                                <Text style={styles.modalButtonText}>Löschen</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    saveButton: {
        backgroundColor: 'blue',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        flex: 1,
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
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
    buttonText: {
        color: 'blue',
        fontSize: 16,
        fontWeight: 'bold',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        fontSize: 18,
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '100%',
    },
    modalButton: {
        backgroundColor: 'blue',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EditNote;