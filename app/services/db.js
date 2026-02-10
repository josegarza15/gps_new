import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('locations.db');

export const initDB = () => {
    db.execSync(
        'CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY, latitude REAL, longitude REAL, timestamp TEXT)'
    );
};

export const saveLocation = (lat, lon, timestamp) => {
    db.runSync(
        'INSERT INTO locations (latitude, longitude, timestamp) VALUES (?, ?, ?)',
        [lat, lon, timestamp]
    );
};

export const getUnsyncedLocations = () => {
    return db.getAllSync('SELECT * FROM locations');
};

export const deleteLocations = (ids) => {
    // ids: array of integers
    if (ids.length > 0) {
        db.runSync(`DELETE FROM locations WHERE id IN (${ids.join(',')})`);
    }
};
