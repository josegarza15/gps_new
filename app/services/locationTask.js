import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { saveLocation, getUnsyncedLocations, deleteLocations, initDB } from './db';
import { getZones } from './geofenceStorage';

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
                timeInterval: 60000, // 60 seconds (Battery Optimization)
                distanceInterval: 0, // Force update every 60s regardless of distance
                deferredUpdatesInterval: 0, // Immediate updates
                deferredUpdatesDistance: 0,
                pausesUpdatesAutomatically: false, // CRITICAL: Prevent OS from killing task when stationary
                activityType: Location.ActivityType.AutomotiveNavigation, // iOS hint, helps keep it alive
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

            // --- Geofencing Logic ---
            try {
                // Check Safe Zones
                const zones = await getZones(); // From local storage
                let inSafeZone = false;

                // Simple inline distance check (Haversine) if geo utils not available, but let's import it or use simple math
                // We imported getDistance from utils if available, or lets define it here to be safe and self-contained tasks
                const getDist = (lat1, lon1, lat2, lon2) => {
                    const R = 6371e3;
                    const φ1 = lat1 * Math.PI / 180;
                    const φ2 = lat2 * Math.PI / 180;
                    const Δφ = (lat2 - lat1) * Math.PI / 180;
                    const Δλ = (lon2 - lon1) * Math.PI / 180;
                    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return R * c;
                };

                let minDistance = 999999;
                let closestZoneName = "";

                for (const zone of zones) {
                    const dist = getDist(lat, lon, zone.latitude, zone.longitude);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestZoneName = zone.name;
                    }
                    if (dist < (zone.radius || 100)) { // 100m radius
                        inSafeZone = true;
                        console.log(`✅ In Safe Zone: ${zone.name} (${Math.round(dist)}m)`);
                        break;
                    }
                }

                if (!inSafeZone && zones.length > 0) {
                    console.log(`❌ OUT of Safe Zone. Closest: ${closestZoneName} (${Math.round(minDistance)}m)`);
                }

                // --- Software Throttling Strategy (Robust for Android 12+) ---
                // We DO NOT change the native tracking interval (it stays at 60s/Balanced).
                // This prevents "ForegroundServiceStartNotAllowedException" and ensures we detect
                // exiting the zone immediately (within 60s) instead of waiting 10 mins.

                if (inSafeZone) {
                    const lastSent = await SecureStore.getItemAsync('last_sent_timestamp');
                    const now = Date.now();

                    // If we sent a location less than 10 mins ago, SKIP sending now.
                    // This saves Network Battery (Radio), which is the biggest consumer.
                    if (lastSent && (now - parseInt(lastSent)) < 600000) {
                        console.log("In Safe Zone - Skipping server upload (Software Throttling)");
                        return; // EXIT TASK without sending
                    }

                    // If > 10 mins, we proceed to send below and update timestamp
                    await SecureStore.setItemAsync('last_sent_timestamp', now.toString());
                    console.log("In Safe Zone - Heartbeat / Sending update");
                } else {
                    // If OUT of safe zone, we always send immediately (60s interval).
                    // We remove the timestamp so that if we enter a zone again, we start fresh.
                    await SecureStore.deleteItemAsync('last_sent_timestamp');
                }
                // -----------------------------------------------------------

            } catch (geoError) {
                console.error("Geofencing check error", geoError);
            }
            // ------------------------

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
