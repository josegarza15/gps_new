import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { startLocationTracking, stopLocationTracking } from '../services/locationTask';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { brand, modelName } from 'expo-device';
import { Ionicons } from '@expo/vector-icons';
import { addZone, getZones, deleteZone } from '../services/geofenceStorage';


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

    // Geofencing State
    const [modalVisible, setModalVisible] = useState(false);
    const [zoneName, setZoneName] = useState('');
    const [zones, setZones] = useState([]);

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
        if (isRegistered) {
            // CRITICAL FIX: Always re-apply tracking options on app start.
            // This ensures that if the app was previously "stuck" in a 10-minute interval (Low Mode),
            // it gets reset to the correct 30s interval immediately.
            console.log("Refreshing tracking configuration...");
            await startLocationTracking();
        }
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

    const openZoneModal = async () => {
        const loadedZones = await getZones();
        setZones(loadedZones);
        setModalVisible(true);
    };

    const handleAddZone = async () => {
        if (!location) {
            Alert.alert("Error", "No hay ubicación actual para guardar.");
            return;
        }
        if (!zoneName.trim()) {
            Alert.alert("Nombre requerido", "Ingresa un nombre para la zona (ej. Casa).");
            return;
        }

        const success = await addZone({
            name: zoneName,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        });

        if (success) {
            Alert.alert("Guardado", "Zona segura agregada.");
            setZoneName('');
            const updated = await getZones();
            setZones(updated);
        } else {
            Alert.alert("Error", "No se pudo guardar la zona.");
        }
    };

    const handleDeleteZone = async (id) => {
        await deleteZone(id);
        const updated = await getZones();
        setZones(updated);
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

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#607D8B', marginTop: 10 }]}
                            onPress={openZoneModal}
                        >
                            <Text style={styles.actionButtonText}>ZONAS SEGURAS</Text>
                            <Text style={styles.actionSubtext}>Ahorro de Batería</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Secure Zone Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalView}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Zonas Seguras</Text>
                            <Text style={styles.modalSub}>Si estás en una zona segura, el GPS se actualizará cada 10 mins para ahorrar batería.</Text>

                            <View style={styles.addZoneContainer}>
                                <Text style={styles.label}>Agregar Ubicación Actual:</Text>
                                <TextInput
                                    style={[styles.input, { marginBottom: 10 }]}
                                    placeholder="Nombre (ej. Casa)"
                                    value={zoneName}
                                    onChangeText={setZoneName}
                                />
                                <TouchableOpacity style={[styles.primaryButton, { padding: 10 }]} onPress={handleAddZone}>
                                    <Text style={styles.buttonText}>Guardar Zona</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { marginTop: 20 }]}>Zonas Guardadas:</Text>
                            <FlatList
                                data={zones}
                                keyExtractor={item => item.id}
                                style={{ maxHeight: 200, width: '100%' }}
                                renderItem={({ item }) => (
                                    <View style={styles.zoneItem}>
                                        <Text style={styles.zoneName}>{item.name}</Text>
                                        <TouchableOpacity onPress={() => handleDeleteZone(item.id)}>
                                            <Ionicons name="trash" size={20} color={COLORS.danger} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                ListEmptyComponent={<Text style={styles.emptyText}>No hay zonas guardadas.</Text>}
                            />

                            <TouchableOpacity
                                style={[styles.updateButton, { marginTop: 20, width: '100%', alignItems: 'center', padding: 15, borderRadius: 10 }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>CERRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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
    },
    // --- Modal Styles Fixed ---
    modalView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20
    },
    modalContent: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        maxHeight: '80%'
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 5
    },
    modalSub: {
        fontSize: 14,
        color: COLORS.subtext,
        marginBottom: 20,
        lineHeight: 20
    },
    addZoneContainer: {
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E8ED',
        width: '100%'
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 5
    },
    currentLocText: {
        fontSize: 12,
        color: COLORS.primary,
        marginBottom: 10,
        fontWeight: 'bold'
    },
    modalInput: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 10
    },
    saveZoneButton: {
        backgroundColor: '#455A64',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    saveZoneText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14
    },
    zoneList: {
        marginTop: 5,
        width: '100%'
    },
    zoneItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    zoneName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text
    },
    zoneCoords: {
        fontSize: 12,
        color: '#999',
        marginTop: 2
    },
    deleteButton: {
        padding: 5
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center'
    },
    emptyText: {
        color: COLORS.subtext,
        fontSize: 14
    },
    emptySubText: {
        color: '#B0BEC5',
        fontSize: 12,
        marginTop: 5
    },
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
