import React, { useEffect, useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { app, FIREBASE_AUTH } from '../../FirebaseConfig';
import { launchImageLibrary, PhotoQuality } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView } from 'react-native';
import ColorPicker from 'react-native-wheel-color-picker';
import Slider from '@react-native-community/slider';

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

const COLORS = [
    '#FFCDD2',
    '#F8BBD0',
    '#E1BEE7',
    '#D1C4E9',
    '#C5CAE9',
    '#BBDEFB',
    '#B3E5FC',
];

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
    const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const showModal = (msg: string) => {
        setMessage(msg);
        setModalVisible(true);
    };

    const fetchCategories = async () => {
    const user = FIREBASE_AUTH.currentUser;

    if (!user) {
        showModal('Kein Nutzer angemeldet. Bitte logge dich ein.');
        return;
    }

    try {
        // Kategorien nach userID filtern
        const q = query(collection(db, 'categories'), where('userID', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedCategories = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Category[];
        setCategories(fetchedCategories);
    } catch (error) {
        console.error('Fehler beim Abrufen der Kategorien:', error);
        showModal('Kategorien konnten nicht geladen werden.');
    }
};



    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateCategory = async () => {
    const user = FIREBASE_AUTH.currentUser;

    if (!user) {
        showModal('Kein Nutzer angemeldet. Bitte logge dich ein.');
        return;
    }

    if (!newCategory.trim()) {
        showModal('Bitte gib einen Namen für die Kategorie ein.');
        return;
    }

    try {
        const docRef = await addDoc(collection(db, 'categories'), {
            name: newCategory,
            color: selectedColor,
            userID: user.uid, // Nutzer-ID hinzufügen
        });
        setCategories((prev) => [
            ...prev,
            { id: docRef.id, name: newCategory, color: selectedColor, userID: user.uid },
        ]);
        setNewCategory('');
        setSelectedColor(COLORS[0]);
        showModal('Kategorie erfolgreich erstellt!');
    } catch (error) {
        console.error('Fehler beim Erstellen der Kategorie:', error);
        showModal('Kategorie konnte nicht erstellt werden.');
    }
};



    const handleDeleteCategory = async (categoryId: string) => {
        try {
            await deleteDoc(doc(db, 'categories', categoryId));            
            setCategories((prev) => prev.filter((category) => category.id !== categoryId));
            showModal('Erfolg! Kategorie erfolgreich gelöscht.');
        } catch (error) {
            console.error('Fehler beim Löschen der Kategorie:', error);
            showModal('Fehler! Kategorie konnte nicht gelöscht werden.');
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

    const handleRemoveImage = (url: string) => {
        setImageURLs((prev) => prev.filter((imageUrl) => imageUrl !== url));
    };

    const handleAddShareUser = async () => {
        if (!shareUsername.trim()) {
            showModal('Benutzername darf nicht leer sein.');
            return;
        }

        if (sharedWith.some((user) => user.username === shareUsername.trim())) {
            showModal('Benutzer wurde bereits hinzugefügt.');
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
                showModal('Benutzername nicht gefunden.');
            }
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Benutzers zur Freigabe:', error);
            showModal('Fehler beim Hinzufügen des Benutzers.');
        }
    };

    const removeSharedUser = (uid: string) => {
        setSharedWith((prev) => prev.filter((user) => user.uid !== uid));
    };

    
    const handleSaveNote = async () => {
        const user = FIREBASE_AUTH.currentUser;
        const userName = user?.displayName || 'Unknown User';

        if (!user) {
            showModal('Kein Nutzer angemeldet. Bitte logge dich ein.');
            return;
        }

        if (!title || !description || !selectedCategory) {
            showModal('Bitte fülle alle Felder aus und wähle eine Kategorie.');
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
            showModal('Notiz erfolgreich erstellt!');
            setTitle('');
            setDescription('');
            setImageURLs([]);
            setSharedWith([]);
            setSelectedCategory(null);
            setTimeout(() => {
                navigation.navigate('Inside');
                }, 1000);
        } catch (error) {
            console.error('Fehler beim Erstellen der Notiz: ', error);
            showModal('Fehler beim Erstellen der Notiz.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Text style={styles.heading}>Neue Notiz erstellen</Text>
    
                {/* Titel-Eingabe */}
                <TextInput
                    style={styles.input}
                    placeholder="Titel"
                    value={title}
                    onChangeText={setTitle}
                />
    
                {/* Beschreibung-Eingabe */}
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Beschreibung"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />
    
                {/* Kategorie-Auswahl */}
                <View style={styles.categoryContainer}>
                    <Text style={styles.label}>Kategorie:</Text>
                    <Picker
                        selectedValue={selectedCategory}
                        style={styles.picker}
                        onValueChange={(itemValue: React.SetStateAction<string | null>) => setSelectedCategory(itemValue)}
                        testID='category-picker'
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
                <Text style={styles.label}>Neue Kategorie erstellen:</Text>

                {/* Neue Kategorie erstellen */}
                <View style={styles.newCategoryContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Neue Kategorie erstellen"
                        value={newCategory}
                        onChangeText={setNewCategory}
                    />
    <TouchableOpacity
    style={[styles.colorPreview, { backgroundColor: selectedColor }]}
    onPress={() => setIsColorPickerVisible(true)} 
>
    <Text style={styles.colorPreviewText}>Farbe für neue Kategorie auswählen</Text>
</TouchableOpacity>
                    <TouchableOpacity
                        style={styles.createCategoryButton}
                        onPress={handleCreateCategory}
                    >
                        <Text style={styles.buttonTextWhite}>Kategorie hinzufügen</Text>
                    </TouchableOpacity>
                </View>
    
                {/* Kategorien anzeigen */}
                <Text style={[styles.label, { marginTop: 20 }]}>Erstellte Kategorie:</Text>

                <View style={styles.colorPalette}>
                    {categories.map((category) => (
                        <View key={category.id} style={styles.categoryItem}>
                            <View
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: category.color },
                                ]}
                            />
                            <Text style={styles.categoryName}>{category.name}</Text>
                            <TouchableOpacity
                                style={styles.deleteCategoryButton}
                                onPress={() => handleDeleteCategory(category.id)}
                            >
                                <Text style={styles.deleteCategoryText}>X</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
    
                {/* Bilder hinzufügen */}
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
    
                {/* Benutzer teilen */}
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
                                <TouchableOpacity
                                    onPress={() => removeSharedUser(user.uid)}
                                    style={styles.removeButton}
                                >
                                    <Text style={styles.removeButtonText}>X</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
    
                {/* Speichern-Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveNote}>
                    <Text style={styles.buttonTextWhite}>Speichern</Text>
                </TouchableOpacity>
    
                {/* Modal für Color Picker */}
                {isColorPickerVisible && (
    <Modal
        visible={isColorPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsColorPickerVisible(false)}
    >
        <View style={styles.modalContainer}>
            <ColorPicker
                color={selectedColor}
                onColorChangeComplete={(color) => setSelectedColor(color)} 
                thumbSize={40}
                sliderSize={40}
                noSnap={true}
                row={false}
            />
            <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsColorPickerVisible(false)} 
            >
                <Text style={styles.modalCloseText}>Schliessen</Text>
            </TouchableOpacity>
        </View>
    </Modal>
)}
    
                {/* Nachricht anzeigen */}
                {modalVisible && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text testID='success-message' style={styles.modalText}>{message}</Text>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Okay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
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
        resizeMode: 'cover', 
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
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    modalText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButton: {
        backgroundColor: 'blue',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
    categoryContainer: {
        marginBottom: 15,
    },
    newCategoryContainer: {
        marginTop: 15,
        justifyContent: 'center',
    },
    colorPalette: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 10,
    },
    categoryItem: {
        alignItems: 'center',
        margin: 5,
    },
    categoryName: {
        fontSize: 12,
        marginTop: 5,
        textAlign: 'center',
        color: '#333',
    },
    deleteCategoryButton: {
        marginTop: 5,
        backgroundColor: 'red',
        borderRadius: 5,
        padding: 5,
        alignItems: 'center',
    },
    deleteCategoryText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    picker: {
        height: 50,
        backgroundColor: '#eaeaea',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 15,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-between', 
    },
    colorPreview: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    colorPreviewText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    modalContainer2: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalCloseButton: {
        backgroundColor: 'red',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    modalCloseText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});



export default CreateNote;
