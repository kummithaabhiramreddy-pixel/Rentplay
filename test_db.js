const pool = require('./db');

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', res.rows[0]);
    
    // Check tables
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tableNames = tables.rows.map(r => r.table_name);
    console.log('Tables in database:', tableNames);
    
    if (tableNames.includes('rentals')) {
        console.log('Rentals table EXISTS');
    } else {
        console.log('Rentals table MISSING');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
