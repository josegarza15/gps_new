import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { startLocationTracking, stopLocationTracking } from '../services/locationTask';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { brand, modelName } from 'expo-device';
import { Ionicons } from '@expo/vector-icons'; // Make sure you have vector icons, if not, remove or use emoji

// Modern Color Palette
const COLORS = {
    primary: '#4A90E2', // Blue
    secondary: '#50E3C2', // Teal
    danger: '#FF5252',
    background: '#F5F7FA',
    card: '#FFFFFF',
    text: '#333333',
    subtext: '#7F8C8D',
    inputBg: '#E8F0FE',
};

const HomeScreen = ({ navigation }) => {
    const [location, setLocation] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [deviceNameInput, setDeviceNameInput] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkRegistration();
        checkTrackingStatus();
        // Fetch initial location
        fetchCurrentLocation(false);
    }, []);

    const fetchCurrentLocation = async (manual = false) => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se requiere acceso a la ubicación.');
                setLoading(false);
                return;
            }

            // 1. Try to get cached location first for speed
            let loc = await Location.getLastKnownPositionAsync({});
            let usedCached = false;

            if (loc) {
                const now = Date.now();
                const locTime = new Date(loc.timestamp).getTime();
                const isRecent = (now - locTime) < 30000; // 30 seconds

                // If recent enough, or if we just want to show something ASAP
                setLocation(loc);

                if (isRecent && manual) {
                    console.log("Using cached location (recent)");
                    usedCached = true;
                }
            }

            // 2. Fetch fresh location ONLY if manual AND not recent cached
            if ((manual && !usedCached) || !loc) {
                // Use balanced accuracy which is faster than high
                try {
                    // Timeout logic? Expo doesn't support timeout natively in options here widely/consistently
                    // but we can assume balanced is faster.
                    loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    setLocation(loc);
                } catch (e) {
                    console.log("Could not get fresh location, using cached if available");
                    if (!loc) throw e;
                }
            }

            // 3. Auto-save logic
            if (loc) {
                const deviceId = await SecureStore.getItemAsync('device_id');
                if (manual) {
                    await saveManualLocation(loc);
                } else if (deviceId) {
                    // Silent save on startup
                    saveManualLocation(loc, true);
                }
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo obtener la ubicación.");
        } finally {
            setLoading(false);
        }
    };

    const saveManualLocation = async (loc, silent = false) => {
        try {
            const deviceId = await SecureStore.getItemAsync('device_id');
            if (!deviceId) {
                if (!silent) Alert.alert("Atención", "Dispositivo no registrado. La ubicación no se guardó.");
                return;
            }

            await axios.post('https://gps-backend.techone.com.mx/locations/', {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                timestamp: new Date(loc.timestamp).toISOString(),
                device_unique_id: deviceId
            });

            if (!silent) Alert.alert("Éxito", "Ubicación actualizada y guardada.");

        } catch (error) {
            console.error("Save location error", error);
            if (!silent) Alert.alert("Error", "No se pudo guardar la ubicación en el servidor.");
        }
    }

    const checkRegistration = async () => {
        const deviceId = await SecureStore.getItemAsync('device_id');
        if (deviceId) {
            // Verify with backend if device actually exists
            try {
                await axios.get(`https://gps-backend.techone.com.mx/devices/${deviceId}`);
                setIsRegistered(true);
            } catch (error) {
                console.log("Device not found on server, clearing local storage");
                await SecureStore.deleteItemAsync('device_id');
                setIsRegistered(false);
            }
        }
    };

    const registerDevice = async () => {
        if (!deviceNameInput.trim()) {
            Alert.alert("Nombre requerido", "Por favor ingresa un nombre para identificar este dispositivo.");
            return;
        }

        setLoading(true);
        try {
            // Always generate new ID if not registered or cleared
            const uniqueId = `device-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const response = await axios.post('https://gps-backend.techone.com.mx/devices/', {
                device_id: uniqueId,
                name: deviceNameInput, // User input name
                mac_address: 'unknown',
                brand: brand || 'Generic',
                model: modelName || 'Generic'
            });

            if (response.data.id) {
                await SecureStore.setItemAsync('device_id', uniqueId);
                setIsRegistered(true);
                Alert.alert('¡Bienvenido!', 'Dispositivo registrado correctamente.');
            }
        } catch (e) {
            console.error("Registration failed", e);
            Alert.alert('Error', 'No se pudo registrar el dispositivo. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    const checkTrackingStatus = async () => {
        const isRegistered = await TaskManager.isTaskRegisteredAsync('background-location-task');
        setIsTracking(isRegistered);
    };

    const toggleTracking = async () => {
        if (isTracking) {
            await stopLocationTracking();
            setIsTracking(false);
        } else {
            await startLocationTracking();
            setIsTracking(true);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>

                <View style={styles.header}>
                    <Text style={styles.title}>📍 GPS Tracker</Text>
                    <Text style={styles.subtitle}>{isRegistered ? "Dispositivo Activo" : "Configuración Inicial"}</Text>
                </View>

                {/* Location Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Ubicación Actual</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    ) : location ? (
                        <View>
                            <View style={styles.coordRow}>
                                <Text style={styles.coordLabel}>Latitud:</Text>
                                <Text style={styles.coordValue}>{location.coords.latitude.toFixed(6)}</Text>
                            </View>
                            <View style={styles.coordRow}>
                                <Text style={styles.coordLabel}>Longitud:</Text>
                                <Text style={styles.coordValue}>{location.coords.longitude.toFixed(6)}</Text>
                            </View>
                            <Text style={styles.timestamp}>
                                {new Date(location.timestamp).toLocaleTimeString()}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.placeholderText}>Obteniendo ubicación...</Text>
                    )}
                </View>

                {/* Registration Section */}
                {!isRegistered ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Registrar Dispositivo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre del Dispositivo (Ej: Camión 1)"
                            value={deviceNameInput}
                            onChangeText={setDeviceNameInput}
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity style={styles.primaryButton} onPress={registerDevice} disabled={loading}>
                            <Text style={styles.buttonText}>{loading ? "Registrando..." : "Guardar Registro"}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.card, styles.registeredCard]}>
                        <Text style={styles.successText}>✅ Dispositivo Registrado</Text>
                    </View>
                )}

                {/* Actions */}
                {isRegistered && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, isTracking ? styles.stopButton : styles.startButton]}
                            onPress={toggleTracking}
                        >
                            <Text style={styles.actionButtonText}>
                                {isTracking ? "DETENER RASTREO" : "INICIAR RASTREO"}
                            </Text>
                            <Text style={styles.actionSubtext}>
                                {isTracking ? "En segundo plano" : "Desactivado"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.updateButton]}
                            onPress={() => fetchCurrentLocation(true)}
                        >
                            <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>ACTUALIZAR SERVIDOR</Text>
                            <Text style={[styles.actionSubtext, { color: COLORS.subtext }]}>Manual</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={async () => {
                        await SecureStore.deleteItemAsync('userToken');
                        navigation.navigate('Login');
                    }}
                >
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        padding: 20,
        alignItems: 'center',
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.subtext,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 15,
        padding: 20,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 15,
    },
    coordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 4
    },
    coordLabel: {
        fontWeight: '500',
        color: COLORS.subtext
    },
    coordValue: {
        fontWeight: 'bold',
        color: COLORS.text
    },
    timestamp: {
        marginTop: 5,
        textAlign: 'right',
        fontSize: 12,
        color: '#999'
    },
    placeholderText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        padding: 10
    },
    input: {
        backgroundColor: COLORS.inputBg,
        padding: 15,
        borderRadius: 10,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 15
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16
    },
    registeredCard: {
        backgroundColor: '#E8F5E9',
        borderColor: '#C8E6C9',
        borderWidth: 1,
        alignItems: 'center'
    },
    successText: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 16
    },
    actionsContainer: {
        width: '100%',
        marginBottom: 30
    },
    actionButton: {
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    startButton: {
        backgroundColor: COLORS.secondary,
    },
    stopButton: {
        backgroundColor: COLORS.danger,
    },
    updateButton: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 1
    },
    updateButtonText: { // fix for Action Button Text inside update button if needed, but reusing style above
        color: COLORS.primary
    },
    actionSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 4
    },
    logoutButton: {
        padding: 15
    },
    logoutText: {
        color: COLORS.subtext,
        fontSize: 14,
        textDecorationLine: 'underline'
    }
});

// Since I reused actionButtonText which has color #FFF, 
// I need to override it for the update button which has white background.
// Let's create a specific style for update button text
const stylesExtra = StyleSheet.create({
    updateText: {
        color: COLORS.primary
    },
    updateSubtext: {
        color: COLORS.subtext
    }
});

// Applying the fix directly in render:
// See below for corrected styles usage in JSX


export default HomeScreen;
