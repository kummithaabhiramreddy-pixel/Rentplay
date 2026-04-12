const pool = require('./db');
async function setup() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            city VARCHAR(100),
            category VARCHAR(100),
            title VARCHAR(200) NOT NULL,
            body TEXT NOT NULL,
            rating INT NOT NULL,
            tags TEXT,
            helpful INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Reviews table setup complete');
    } catch(err) {
        console.error('Error setting up reviews table', err);
    }
    process.exit(0);
}
setup();
