const pool = require('../db');

async function addPhoneColumn() {
    try {
        await pool.query('ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS phone VARCHAR(20);');
        console.log('✅ phone column added to support_requests table.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding phone column:', err.message);
        process.exit(1);
    }
}

addPhoneColumn();
