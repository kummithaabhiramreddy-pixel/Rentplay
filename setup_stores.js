const pool = require('./db');

async function setupStores() {
    try {
        console.log("Creating stores table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stores (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                location VARCHAR(150),
                lat DECIMAL(10, 8),
                lng DECIMAL(11, 8),
                contact VARCHAR(20),
                status VARCHAR(20) DEFAULT 'active'
            );
        `);

        console.log("Seeding stores...");
        const stores = [
            ['Bhimavaram Central-Zone (HQ)', 'J P Road, Bhimavaram', 16.5449, 81.5212, '8185951564'],
            ['Palakollu South-East Hub', 'Main Road, Palakollu', 16.5186, 81.7231, '8185951565'],
            ['Tanuku North Hub', 'Old Town, Tanuku', 16.7570, 81.6967, '8185951566'],
            ['Akividu West Store', 'Station Road, Akividu', 16.6025, 81.3789, '8185951567'],
            ['Undi Service Point', 'Undi Junction, Undi', 16.5910, 81.4649, '8185951568']
        ];

        for (const store of stores) {
            await pool.query(
                'INSERT INTO stores (name, location, lat, lng, contact) VALUES ($1, $2, $3, $4, $5)',
                store
            );
        }

        console.log("Stores setup complete!");
        process.exit(0);
    } catch (err) {
        console.error("Error setting up stores:", err);
        process.exit(1);
    }
}

setupStores();
