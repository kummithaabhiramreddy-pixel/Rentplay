const pool = require('./db');
pool.query('SELECT * FROM reviews ORDER BY id DESC LIMIT 5')
  .then(r => {
    console.log('ROW COUNT:', r.rows.length);
    r.rows.forEach(row => console.log(JSON.stringify(row)));
    process.exit(0);
  })
  .catch(e => {
    console.error('ERROR:', e.message);
    process.exit(1);
  });
