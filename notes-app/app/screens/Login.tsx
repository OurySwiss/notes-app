import React, { useState } from 'react';
import {
    TextInput,
    View,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    TouchableOpacity,
    Text
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { RootStackParamList } from '../types';
import Icon from 'react-native-vector-icons/FontAwesome';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const auth = FIREBASE_AUTH;

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const signIn = async () => {
        setEmailError('');
        setPasswordError('');

        let valid = true;

        if (!validateEmail(email)) {
            setEmailError('Email cannot be empty');
            valid = false;
        }

        if (password.length === 0) {
            setPasswordError('Password cannot be empty');
            valid = false;
        }

        if (!valid) return;

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('Logged in successfully');
            setLoading(false);
        } catch (error) {
            alert('Error logging in');
            console.log(error);
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
                <Text style={styles.title}>Login</Text>
                <TextInput
                    value={email}
                    style={styles.input}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={(text) => setEmail(text)}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                <View style={styles.passwordContainer}>
                    <TextInput
                        secureTextEntry={!passwordVisible}
                        value={password}
                        style={styles.passwordInput}
                        placeholder="Password"
                        autoCapitalize="none"
                        onChangeText={(text) => setPassword(text)}
                    />
                    <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.icon}>
                        <Icon name={passwordVisible ? "eye" : "eye-slash"} size={20} color="grey" />
                    </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <>
                        <TouchableOpacity style={styles.button} onPress={signIn}>
                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => navigation.navigate('Registration')}>
                            <Text style={[styles.buttonText, styles.buttonOutlineText]}>Create account</Text>
                        </TouchableOpacity>
                    </>
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderColor: '#ccc',
        marginBottom: 10,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderColor: '#ccc',
        paddingRight: 40, // Added padding to the right for the icon
    },
    icon: {
        position: 'absolute',
        right: 10,
        padding: 10,
    },
    button: {
        marginVertical: 10,
        height: 50,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007BFF',
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007BFF',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    buttonOutlineText: {
        color: '#007BFF',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
});
