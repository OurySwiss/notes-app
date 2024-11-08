// app/screens/Index.tsx
import React from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types'; // Pfad anpassen, falls erforderlich
import { useNavigation } from '@react-navigation/native';

// Definiere den Typ für die Navigation
type IndexScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const Index: React.FC = () => {
    // Zugriff auf die Navigation mit typisierter `useNavigation`-Hook
    const navigation = useNavigation<IndexScreenNavigationProp>();
    const user = FIREBASE_AUTH.currentUser;

    return (
        <View style={styles.container}>
            <Text style={styles.greeting}>Hello {user?.displayName || 'User'}</Text>
            
            {/* Button für das Erstellen einer neuen Notiz */}
            <Button
                title="Neue Notiz erstellen"
                onPress={() => navigation.navigate('CreateNote')}
            />
            
            <Button
                title="Alle Notizen"
                onPress={() => navigation.navigate('AllNotes')}
            />

            {/* Logout-Button */}
            <Button
                title="Logout"
                onPress={() => FIREBASE_AUTH.signOut()}
                color="red"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    greeting: {
        fontSize: 24,
        marginBottom: 20,
    },
});

export default Index;
