import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { saveLocation, getUnsyncedLocations, deleteLocations, initDB } from './db';

const LOCATION_TASK_NAME = 'background-location-task';
const API_URL = 'https://gps-backend.techone.com.mx';

// Initialize DB
initDB();

export const startLocationTracking = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus === 'granted') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus === 'granted') {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 30000,
                distanceInterval: 0, // Force update every 30s regardless of distance
                deferredUpdatesInterval: 30000,
                deferredUpdatesDistance: 0,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                    notificationTitle: "Rastreo GPS Activo",
                    notificationBody: "Enviando tu ubicación...",
                },
            });
            console.log('Tracking started');
        }
    }
};

export const stopLocationTracking = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('Tracking stopped');
    }
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error(error);
        return;
    }
    if (data) {
        const { locations } = data;
        const location = locations[0]; // Get the most recent location
        if (location) {
            const timestamp = new Date().toISOString();
            const lat = location.coords.latitude;
            const lon = location.coords.longitude;

            console.log('Background Location:', lat, lon);

            // Try to send to server immediately
            try {
                const deviceId = await SecureStore.getItemAsync('device_id');
                if (!deviceId) {
                    console.log("No device ID registered, saving locally.");
                    saveLocation(lat, lon, timestamp);
                    return;
                }

                await axios.post(`${API_URL}/locations/`, {
                    latitude: lat,
                    longitude: lon,
                    timestamp: timestamp,
                    device_unique_id: deviceId
                });
                console.log("Location sent to server");

                // Sync old locations if any
                syncOfflineLocations();

            } catch (err) {
                console.log("Network error, saving locally", err.message);
                saveLocation(lat, lon, timestamp);
            }
        }
    }
});

const syncOfflineLocations = async () => {
    try {
        const locations = getUnsyncedLocations();
        if (locations.length === 0) return;

        const deviceId = await SecureStore.getItemAsync('device_id');
        if (!deviceId) return;

        console.log(`Syncing ${locations.length} offline locations...`);

        // Batch upload could be better, but loop for simplicity V1
        const successfulIds = [];
        for (const loc of locations) {
            try {
                await axios.post(`${API_URL}/locations/`, {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    timestamp: loc.timestamp,
                    device_unique_id: deviceId
                });
                successfulIds.push(loc.id);
            } catch (e) {
                console.error("Failed to sync one location", e.message);
                // Break to retry later if network is flaky
                break;
            }
        }

        if (successfulIds.length > 0) {
            deleteLocations(successfulIds);
            console.log(`Synced ${successfulIds.length} locations.`);
        }

    } catch (error) {
        console.error("Error syncing offline locations", error);
    }
}
