import React, { useEffect, useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    FlatList,
    Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { app, FIREBASE_AUTH } from '../../FirebaseConfig';
import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    getFirestore,
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
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

interface SharedUser {
    uid: string;
    username: string;
}

interface Category {
    id: string;
    name: string;
    color: string;
}

const EditNote: React.FC<Props> = ({ route, navigation }) => {
    const { noteId } = route.params;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageURLs, setImageURLs] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [shareUsername, setShareUsername] = useState('');
    const [sharedWith, setSharedWith] = useState<SharedUser[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>("");
    const [isOwner, setIsOwner] = useState(false);


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
                setSelectedCategory(noteData.category || null);

                const currentUser = FIREBASE_AUTH.currentUser;
                if (currentUser && currentUser.uid === noteData.ownerId) {
                    setIsOwner(true);
                } else {
                    setIsOwner(false);
                }

                const sharedUserIDs = noteData.sharedWith || [];
                const usersCollection = collection(db, 'userProfile');
                const userQuery = query(usersCollection, where('uid', 'in', sharedUserIDs));
                const userSnapshot = await getDocs(userQuery);

                const fetchedUsers = userSnapshot.docs.map((doc) => ({
                    uid: doc.id,
                    username: doc.data().username,
                }));

                setSharedWith(fetchedUsers);
            } else {
                setMessage('Notiz nicht gefunden.');
            }
        } catch (error) {
            console.error('Fehler beim Laden der Notiz:', error);
            setMessage('Fehler beim Laden der Notiz.');
        }
    };

        const fetchCategories = async () => {
            const user = FIREBASE_AUTH.currentUser;
            if (!user) {
                console.error('Kein Nutzer angemeldet.');
                return;
            }

            try {
                const q = query(collection(db, 'categories'), where('userID', '==', user.uid));
                const querySnapshot = await getDocs(q);
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

        fetchNote();
        fetchCategories();
    }, [noteId]);

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

    const handleRemoveImage = (url: string) => {
        setImageURLs((prev) => prev.filter((imageUrl) => imageUrl !== url));
    };

    const handleAddShareUser = async () => {
        if (!shareUsername.trim()) {
            Alert.alert('Fehler', 'Benutzername darf nicht leer sein.');
            return;
        }

        try {
            const usersRef = collection(db, 'userProfile');
            const q = query(usersRef, where('username', '==', shareUsername.trim()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                const userToShare: SharedUser = {
                    uid: userData.uid,
                    username: userData.username,
                };

                setSharedWith((prev) => [...prev, userToShare]);
                setShareUsername('');
            } else {
                Alert.alert('Fehler', 'Benutzername nicht gefunden.');
            }
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Benutzers zur Freigabe:', error);
            Alert.alert('Fehler', 'Fehler beim Hinzufügen des Benutzers zur Freigabe.');
        }
    };

    const removeSharedUser = (uid: string) => {
        setSharedWith((prev) => prev.filter((user) => user.uid !== uid));
    };

    const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
        setMessage('Bitte fülle alle Felder aus.');
        return;
    }

    if (!selectedCategory || selectedCategory === "") {
        setMessage('Bitte wähle eine gültige Kategorie aus.');
        return;
    }

    try {
        const noteRef = doc(db, 'notes', noteId);
        await updateDoc(noteRef, {
            title,
            description,
            imageURL: imageURLs,
            sharedWith: sharedWith.map((user) => user.uid),
            category: selectedCategory,
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
                editable={isOwner}
            />
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Beschreibung"
                value={description}
                onChangeText={setDescription}
                multiline
                editable={isOwner}
            />
            <View style={styles.categoryContainer}>
                <Text style={styles.label}>Kategorie wählen:</Text>
                <Picker
                    selectedValue={selectedCategory}
                    style={styles.picker}
                    onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                    enabled={isOwner}
                >
                    <Picker.Item label="Kategorie auswählen" value={""} />
                    {categories.map((category) => (
                        <Picker.Item
                            key={category.id}
                            label={category.name}
                            value={category.id}
                        />
                    ))}
                </Picker>
            </View>
            <FlatList
                data={imageURLs}
                keyExtractor={(url, index) => index.toString()}
                renderItem={({ item: url }) => (
                    <View style={styles.imageWrapper}>
                        <Image source={{ uri: url }} style={styles.image} />
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleRemoveImage(url)}
                        >
                            <Text style={styles.deleteButtonText}>X</Text>
                        </TouchableOpacity>
                    </View>
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageContainer}
            />
            <TouchableOpacity style={styles.shareButton} onPress={handleImagePicker}>
                <Text style={styles.buttonTextWhite}>Bild hinzufügen</Text>
            </TouchableOpacity>
            <TextInput
                style={styles.input}
                placeholder="Benutzername zum Teilen eingeben"
                value={shareUsername}
                onChangeText={setShareUsername}
            />
            <TouchableOpacity style={styles.shareButton} onPress={handleAddShareUser}>
                <Text style={styles.buttonTextWhite}>Benutzer zur Freigabe hinzufügen</Text>
            </TouchableOpacity>
            <View style={styles.sharedWithContainer}>
                <Text style={styles.shareHeading}>Geteilt mit:</Text>
                {sharedWith.map((user) => (
                    <View key={user.uid} style={styles.sharedUserContainer}>
                        <Text style={styles.sharedUserText}>{user.username}</Text>
                        <TouchableOpacity
                            onPress={() => removeSharedUser(user.uid)}
                            style={styles.removeButton}
                        >
                            <Text style={styles.removeButtonText}>X</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.saveButton, !isOwner && { backgroundColor: '#ccc' }]}
                    onPress={isOwner ? handleSave : undefined}
                    disabled={!isOwner}
                >
                    <Text style={[styles.buttonTextWhite, !isOwner && { color: '#666' }]}>
                        Speichern
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.deleteButtonContainer,
                        !isOwner && { borderColor: '#ccc' },
                    ]}
                    onPress={isOwner ? handleDelete : undefined}
                    disabled={!isOwner}
                >
                    <Text style={[styles.buttonText, !isOwner && { color: '#666' }]}>
                        Löschen
                    </Text>
                </TouchableOpacity>
            </View>
            {message ? <Text style={styles.errorMessage}>{message}</Text> : null}
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
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    input: {
        backgroundColor: '#eaeaea',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    message: {
        color: '#555',
        fontSize: 14,
        marginTop: 10,
    },
    imageContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 10,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 5,
    },
    deleteButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'red',
        borderRadius: 10,
        padding: 5,
        zIndex: 1,
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    shareButton: {
        backgroundColor: 'blue',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    deleteButtonContainer: {
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
    sharedWithContainer: {
        marginVertical: 10,
    },
    shareHeading: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    sharedUserContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 8,
    },
    sharedUserText: {
        fontSize: 14,
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
    categoryContainer: {
        marginBottom: 15,
    },
    picker: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    errorMessage: {
        color: 'red',
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
    },
});

export default EditNote;
