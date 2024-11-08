import { onAuthStateChanged } from '@firebase/auth';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from '@firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from '@firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  FIREBASE_AUTH,
  FIREBASE_DB,
  FIREBASE_STORAGE,
} from '../../FirebaseConfig';

const Profile: React.FC = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setUid(user.uid);
        fetchUserProfile(user.uid);
      } else {
        setUid(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const q = query(
        collection(FIREBASE_DB, 'userProfile'),
        where('uid', '==', uid)
      );
      const querySnapshot = await getDocs(q);
      const profileData: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        profileData.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          username: data.username,
          bio: data.bio,
        });
      });
      if (profileData.length > 0) {
        const profile = profileData[0];
        setUserProfile(profile);
        setUsername(profile.username);
        setBio(profile.bio);
        setImageUri(profile.imageUrl);
      }
      console.log('Fetched user profile:', profileData);
    } catch (error) {
      console.log('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!uid) {
      Alert.alert('Fehler', 'Benutzer nicht authentifiziert');
      return;
    }
    try {
      setLoading(true);
      let uploadedImageUrl = imageUri;

      if (imageUri && !imageUri.startsWith('http')) {
        const blob = await fetch(imageUri).then((res) => res.blob());
        const storageRef = ref(
          FIREBASE_STORAGE,
          `profileImages/${uid}/${new Date().toISOString()}`
        );
        await uploadBytes(storageRef, blob);
        uploadedImageUrl = await getDownloadURL(storageRef);
      }

      const profileData = {
        uid, // UID des Benutzers hinzufügen
        username,
        bio,
        imageUrl: uploadedImageUrl,
      };

      if (userProfile) {
        const profileRef = doc(FIREBASE_DB, 'userProfile', userProfile.id);
        await setDoc(profileRef, profileData);
        console.log('Updated profile:', profileData);
      } else {
        const newProfileRef = doc(collection(FIREBASE_DB, 'userProfile'));
        await setDoc(newProfileRef, profileData);
        setUserProfile({
          id: newProfileRef.id,
          ...profileData,
        });
        console.log('Created new profile:', profileData);
      }
      Alert.alert('Erfolg', 'Profil erfolgreich gespeichert');
    } catch (error) {
      console.log('Error saving profile:', error);
      Alert.alert('Fehler', 'Fehler beim Speichern des Profils');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={{ uri: imageUri || 'https://via.placeholder.com/150' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Bio"
            value={bio}
            onChangeText={setBio}
          />
          <Button
            title="Save Profile"
            onPress={handleSaveProfile}
            color="midnightblue"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileContainer: {
    flex: 1,
    alignItems: 'center',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: '80%',
  },
});
