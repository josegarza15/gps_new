import { getValue, setValue } from './db';

const KEY_ZONES = 'safe_zones_v1';

// Zone structure: { id, name, latitude, longitude, radius (meters) }

export const getZones = async () => {
    try {
        const json = getValue(KEY_ZONES);
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
        setValue(KEY_ZONES, JSON.stringify(zones));
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
        setValue(KEY_ZONES, JSON.stringify(filtered));
        return true;
    } catch (e) {
        console.error("Error deleting zone", e);
        return false;
    }
};

export const syncZonesWithServer = async (serverUrl, deviceId) => {
    try {
        console.log("Starting Zone Sync...");
        const localZones = await getZones();

        // 1. Prepare payload (zones to verify/upload)
        const payload = localZones.map(z => ({
            name: z.name,
            latitude: z.latitude,
            longitude: z.longitude,
            radius: z.radius || 100,
            device_unique_id: deviceId
        }));

        // 2. POST to server (Uploads local, returns Merged Full List)
        const response = await fetch(`${serverUrl}/zones/${deviceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status}`);
        }

        const serverZones = await response.json();
        console.log(`Sync complete. Server returned ${serverZones.length} zones.`);

        // 3. Update Local Storage with Server List
        const mergedZones = serverZones.map(sz => ({
            id: sz.id.toString(),
            name: sz.name,
            latitude: sz.latitude,
            longitude: sz.longitude,
            radius: sz.radius
        }));

        setValue(KEY_ZONES, JSON.stringify(mergedZones));
        return mergedZones;

    } catch (error) {
        console.error("Zone Sync Error:", error);
        return null;
    }
};

export const deleteZoneFromCloud = async (serverUrl, deviceId, zoneId) => {
    try {
        await fetch(`${serverUrl}/zones/${deviceId}/${zoneId}`, {
            method: 'DELETE',
        });
        return true;
    } catch (error) {
        console.error("Cloud delete error", error);
        return false;
    }
};
