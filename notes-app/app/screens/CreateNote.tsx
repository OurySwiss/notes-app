import React, { useEffect, useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Alert,
    Picker,
} from 'react-native';
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

interface Category {
    id: string;
    name: string;
    color: string; // Farbe für die Kategorie
}

const COLORS = [
    '#FFCDD2',
    '#F8BBD0',
    '#E1BEE7',
    '#D1C4E9',
    '#C5CAE9',
    '#BBDEFB',
    '#B3E5FC',
]; // Farbauswahl

const CreateNote: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageURLs, setImageURLs] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [shareUsername, setShareUsername] = useState('');
    const [sharedWith, setSharedWith] = useState<SharedUser[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [newCategory, setNewCategory] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]); // Standardfarbe

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Kategorien aus Firestore abrufen
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

    useEffect(() => {
        fetchCategories();
    }, []);

    // Neue Kategorie erstellen
    const handleCreateCategory = async () => {
        if (!newCategory.trim()) {
            Alert.alert('Fehler', 'Bitte gib einen Namen für die Kategorie ein.');
            return;
        }

        try {
            const docRef = await addDoc(collection(db, 'categories'), {
                name: newCategory,
                color: selectedColor, // Farbe hinzufügen
            });
            setCategories((prev) => [
                ...prev,
                { id: docRef.id, name: newCategory, color: selectedColor },
            ]);
            setNewCategory('');
            setSelectedColor(COLORS[0]); // Standardfarbe zurücksetzen
            Alert.alert('Erfolg', 'Kategorie erfolgreich erstellt!');
        } catch (error) {
            console.error('Fehler beim Erstellen der Kategorie:', error);
            Alert.alert('Fehler', 'Kategorie konnte nicht erstellt werden.');
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

    const handleSaveNote = async () => {
        const user = FIREBASE_AUTH.currentUser;
        const userName = user?.displayName || 'Unknown User';

        if (!user) {
            setMessage('Kein Nutzer angemeldet. Bitte logge dich ein.');
            return;
        }

        if (!title || !description || !selectedCategory) {
            setMessage('Bitte fülle alle Felder aus und wähle eine Kategorie.');
            return;
        }

        try {
            await addDoc(collection(db, 'notes'), {
                title,
                description,
                imageURL: imageURLs,
                category: selectedCategory,
                userID: user.uid,
                userName,
                sharedWith: sharedWith.map((user) => user.uid),
                createdAt: new Date(),
            });
            setMessage('Notiz erfolgreich erstellt!');
            setTitle('');
            setDescription('');
            setImageURLs([]);
            setSharedWith([]);
            setSelectedCategory(null);
            navigation.navigate('Inside');
        } catch (error) {
            console.error('Fehler beim Erstellen der Notiz: ', error);
            setMessage('Fehler beim Erstellen der Notiz.');
        }
    };

    const removeSharedUser = (uid: string) => {
        setSharedWith((prev) => prev.filter((user) => user.uid !== uid));
    };

    const handleRemoveImage = (url: string) => {
        setImageURLs((prev) => prev.filter((imageUrl) => imageUrl !== url));
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
            <View style={styles.categoryContainer}>
                <Text style={styles.label}>Kategorie wählen:</Text>
                <Picker
                    selectedValue={selectedCategory}
                    style={styles.picker}
                    onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                >
                    <Picker.Item label="Kategorie auswählen" value="" />
                    {categories.map((category) => (
                        <Picker.Item
                            key={category.id}
                            label={category.name}
                            value={category.id}
                        />
                    ))}
                </Picker>
            </View>
            <View style={styles.newCategoryContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Neue Kategorie erstellen"
                    value={newCategory}
                    onChangeText={setNewCategory}
                />
                <View style={styles.colorPalette}>
                    {COLORS.map((color) => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorCircle,
                                {
                                    backgroundColor: color,
                                    borderWidth: selectedColor === color ? 2 : 0,
                                },
                            ]}
                            onPress={() => setSelectedColor(color)}
                        />
                    ))}
                </View>
                <TouchableOpacity
                    style={styles.createCategoryButton}
                    onPress={handleCreateCategory}
                >
                    <Text style={styles.buttonTextWhite}>Kategorie hinzufügen</Text>
                </TouchableOpacity>
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
            {message ? <Text style={styles.message}>{message}</Text> : null}
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
    categoryContainer: {
        marginBottom: 15,
    },
    newCategoryContainer: {
        marginTop: 15,
        justifyContent: 'center',
    },
    picker: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
    },
    colorPalette: {
        flexDirection: 'row',
        marginVertical: 10,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginHorizontal: 5,
        borderColor: 'black',
    },
    createCategoryButton: {
        backgroundColor: 'blue',
        borderRadius: 25,
        padding: 10,
        alignItems: 'center',
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
        marginVertical: 15,
    },
    buttonTextWhite: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    image: {
        width: 100,
        height: 100,
        resizeMode: 'cover',
        borderRadius: 10,
        marginHorizontal: 5,
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 10,
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
    imageContainer: {
        flexDirection: 'row',
        marginVertical: 10,
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
    message: {
        color: 'red',
        marginTop: 10,
        fontSize: 16,
    },
});

export default CreateNote;
