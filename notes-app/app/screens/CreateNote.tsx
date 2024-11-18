import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { app, FIREBASE_AUTH } from '../../FirebaseConfig';
import { launchImageLibrary, PhotoQuality } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const db = getFirestore(app);

interface SharedUser {
    uid: string;
    username: string;
}

const CreateNote: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageURLs, setImageURLs] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [shareUsername, setShareUsername] = useState('');
    const [sharedWith, setSharedWith] = useState<SharedUser[]>([]);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

    const handleAddShareUser = async () => {
        if (!shareUsername.trim()) {
            Alert.alert("Fehler", "Benutzername darf nicht leer sein.");
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
                Alert.alert("Fehler", "Benutzername nicht gefunden.");
            }
        } catch (error) {
            console.error("Fehler beim Hinzufügen des Benutzers zur Freigabe:", error);
            Alert.alert("Fehler", "Fehler beim Hinzufügen des Benutzers zur Freigabe.");
        }
    };

    const removeSharedUser = (uid: string) => {
        setSharedWith((prev) => prev.filter((user) => user.uid !== uid));
    };

    const handleRemoveImage = (url: string) => {
        setImageURLs((prev) => prev.filter((imageUrl) => imageUrl !== url));
    };

    const handleSaveNote = async () => {
        const user = FIREBASE_AUTH.currentUser;
        const userName = user?.displayName || 'Unknown User';

        if (!user) {
            setMessage('Kein Nutzer angemeldet. Bitte logge dich ein.');
            return;
        }

        if (title && description) {
            try {
                await addDoc(collection(db, 'notes'), {
                    title,
                    description,
                    imageURL: imageURLs,
                    userID: user.uid,
                    userName: userName,
                    sharedWith: sharedWith.map((user) => user.uid),
                });
                setMessage('Notiz erfolgreich erstellt!');
                setTitle('');
                setDescription('');
                setImageURLs([]);
                setSharedWith([]);
                setTimeout(() => {
                navigation.navigate('Inside');
                }, 1000);
            } catch (error) {
                console.error('Fehler beim Erstellen der Notiz:', error);
                setMessage('Fehler beim Erstellen der Notiz.');
            }
        } else {
            setMessage('Bitte Titel und Beschreibung eingeben.');
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

            {sharedWith.length > 0 && (
                <View style={styles.sharedWithContainer}>
                    <Text style={styles.shareHeading}>Geteilt mit:</Text>
                    {sharedWith.map((user) => (
                        <View key={user.uid} style={styles.sharedUserContainer}>
                            <Text style={styles.sharedUserText}>{user.username}</Text>
                            <TouchableOpacity onPress={() => removeSharedUser(user.uid)} style={styles.removeButton}>
                                <Text style={styles.removeButtonText}>X</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveNote}>
                <Text style={styles.buttonTextWhite}>Speichern</Text>
            </TouchableOpacity>
            {message ? <Text testID='success-message' style={styles.message}>{message}</Text> : null}
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
    saveButton: {
        backgroundColor: 'blue',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    shareButton: {
        backgroundColor: 'blue',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonTextWhite: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
});

export default CreateNote;
