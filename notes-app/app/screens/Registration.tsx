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
import { updateProfile, createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { RootStackParamList } from '../types';
import Icon from 'react-native-vector-icons/FontAwesome';

type RegistrationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Registration'>;

const Registration = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const navigation = useNavigation<RegistrationScreenNavigationProp>();
    const auth = FIREBASE_AUTH;

    function validatePassword(password: string) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        return regex.test(password);
    }

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validateName = (name: string) => {
        return name.length >= 4;
    };

    const signUp = async () => {
        setNameError('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');

        /*
        ToDo: Fix validation, currently not working
        let valid = true;

        if (!validateName(name)) {
            setNameError('Name must be at least 4 characters long');
            valid = false;
        }

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email');
            valid = false;
        }

        if (!validatePassword(password)) {
            setPasswordError('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number and one special character');
            valid = false;
        }


        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            valid = false;
        }

        if (!valid) return;
*/
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: name,
                });
            }
            setLoading(false);
            alert('Successfully created User');
            navigation.navigate('Login');
        } catch (error) {
            console.log(error);
            setPasswordError('An error occurred during registration. Please try again.');
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
                <Text style={styles.title}>Register</Text>
                <TextInput
                    value={name}
                    style={styles.input}
                    placeholder="Name"
                    autoCapitalize="none"
                    onChangeText={(text) => setName(text)}
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
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
                <View style={styles.passwordContainer}>
                    <TextInput
                        secureTextEntry={!confirmPasswordVisible}
                        value={confirmPassword}
                        style={styles.passwordInput}
                        placeholder="Confirm Password"
                        autoCapitalize="none"
                        onChangeText={(text) => setConfirmPassword(text)}
                    />
                    <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={styles.icon}>
                        <Icon name={confirmPasswordVisible ? "eye" : "eye-slash"} size={20} color="grey" />
                    </TouchableOpacity>
                </View>
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <>
                        <TouchableOpacity style={styles.button} onPress={signUp}>
                            <Text style={styles.buttonText}>Register</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => navigation.navigate('Login')}>
                            <Text style={[styles.buttonText, styles.buttonOutlineText]}>Back to Login</Text>
                        </TouchableOpacity>
                    </>
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

export default Registration;

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
