import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { setValue } from '../services/db';

const COLORS = {
    primary: '#4A90E2',
    background: '#F5F7FA',
    card: '#FFFFFF',
    text: '#333333',
    inputBg: '#E8F0FE',
};

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Por favor ingresa usuario y contraseña");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('https://gps-backend.techone.com.mx/login', {
                username,
                password,
            });

            if (response.data.access_token) {
                setValue('userToken', response.data.access_token);
                navigation.navigate('Home');
            } else {
                Alert.alert('Error', 'Credenciales inválidas');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Fallo al iniciar sesión. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={styles.emoji}>🛰️</Text>
                    <Text style={styles.title}>GPS Tracker</Text>
                    <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Usuario"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        placeholderTextColor="#999"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#999"
                    />

                    <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? "Verificando..." : "Ingresar"}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40
    },
    emoji: {
        fontSize: 50,
        marginBottom: 10
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 5
    },
    subtitle: {
        fontSize: 16,
        color: '#7F8C8D'
    },
    form: {
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    input: {
        height: 50,
        backgroundColor: COLORS.inputBg,
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
        fontSize: 16,
        color: COLORS.text
    },
    button: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18
    }
});

export default LoginScreen;
