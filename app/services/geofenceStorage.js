import * as SecureStore from 'expo-secure-store';

const KEY_ZONES = 'safe_zones_v1';

// Zone structure: { id, name, latitude, longitude, radius (meters) }

export const getZones = async () => {
    try {
        const json = await SecureStore.getItemAsync(KEY_ZONES);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error("Error reading zones", e);
        return [];
    }
};

export const addZone = async (zone) => {
    try {
        const zones = await getZones();
        // Simple validation
        if (!zone.latitude || !zone.longitude) return false;

        const newZone = {
            id: Date.now().toString(),
            radius: 100, // Default 100m
            ...zone
        };

        zones.push(newZone);
        await SecureStore.setItemAsync(KEY_ZONES, JSON.stringify(zones));
        return true;
    } catch (e) {
        console.error("Error adding zone", e);
        return false;
    }
};

export const deleteZone = async (id) => {
    try {
        const zones = await getZones();
        const filtered = zones.filter(z => z.id !== id);
        await SecureStore.setItemAsync(KEY_ZONES, JSON.stringify(filtered));
        return true;
    } catch (e) {
        console.error("Error deleting zone", e);
        return false;
    }
};
