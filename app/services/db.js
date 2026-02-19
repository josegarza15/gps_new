import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('locations.db');

export const initDB = () => {
    try {
        db.execSync(
            'CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY, latitude REAL, longitude REAL, timestamp TEXT)'
        );
        db.execSync(
            'CREATE TABLE IF NOT EXISTS key_value_store (key TEXT PRIMARY KEY, value TEXT)'
        );
    } catch (e) {
        console.error("Error creating tables", e);
    }
};

export const saveLocation = (lat, lon, timestamp) => {
    try {
        db.runSync(
            'INSERT INTO locations (latitude, longitude, timestamp) VALUES (?, ?, ?)',
            [lat, lon, timestamp]
        );
    } catch (e) {
        console.error("Error saving location to DB:", e);
    }
};

export const getUnsyncedLocations = () => {
    try {
        return db.getAllSync('SELECT * FROM locations');
    } catch (e) {
        console.error("Error getting unsynced locations:", e);
        return [];
    }
};

export const deleteLocations = (ids) => {
    // ids: array of integers
    if (ids.length > 0) {
        try {
            db.runSync(`DELETE FROM locations WHERE id IN (${ids.join(',')})`);
        } catch (e) {
            console.error("Error deleting locations:", e);
        }
    }
};

// --- Key Value Store Helpers (Sync) ---

export const setValue = (key, value) => {
    try {
        db.runSync(
            'INSERT OR REPLACE INTO key_value_store (key, value) VALUES (?, ?)',
            [key, String(value)]
        );
    } catch (e) {
        console.error(`Error setting value for ${key}:`, e);
    }
};

export const getValue = (key) => {
    try {
        const result = db.getFirstSync('SELECT value FROM key_value_store WHERE key = ?', [key]);
        return result ? result.value : null;
    } catch (e) {
        console.error(`Error getting value for ${key}:`, e);
        return null;
    }
};

export const deleteValue = (key) => {
    try {
        db.runSync('DELETE FROM key_value_store WHERE key = ?', [key]);
    } catch (e) {
        console.error(`Error deleting value for ${key}:`, e);
    }
};
