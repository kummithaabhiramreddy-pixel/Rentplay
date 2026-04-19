const express = require('express');
const path = require('path');
const cors = require('cors');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const app = express();

// Middleware setup
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    exposedHeaders: ['X-Backend']
}));
app.options('*', cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple Logger
app.use((req, res, next) => {
    res.setHeader('X-Backend', 'RentPlay-Express');
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// SMS Setup
const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
const twilioNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();
const ownerPhoneNumber = (process.env.OWNER_PHONE_NUMBER || '+918185951564').trim();
const fast2smsKey = (process.env.FAST2SMS_API_KEY || '').trim();
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').trim();

let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

const pool = require('./db');
const axios = require('axios');

async function sendSmsViaTwilio(message, toNumber = ownerPhoneNumber) {
    if (!client) {
        console.error('[SMS] Twilio client is not configured.');
        return { success: false, provider: 'twilio', error: 'Twilio not configured' };
    }
    if (!twilioNumber) {
        console.error('[SMS] Twilio source number is not configured.');
        return { success: false, provider: 'twilio', error: 'Twilio source number not configured' };
    }
    try {
        await client.messages.create({ body: message, from: twilioNumber, to: toNumber });
        console.log(`[SMS] Twilio Success.`);
        return { success: true, provider: 'twilio' };
    } catch (err) {
        console.error(`[SMS] Twilio failed: ${err.message}`);
        return { success: false, provider: 'twilio', error: err.message };
    }
}

async function sendSmsAlert(message) {
    const twilioResult = await sendSmsViaTwilio(message);
    if (twilioResult.success) return twilioResult;
    if (fast2smsKey) {
        try {
            const phoneClean = ownerPhoneNumber.replace(/\D/g, '');
            const phone10 = phoneClean.length > 10 ? phoneClean.slice(-10) : phoneClean;
            const res = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
                route: 'q', message: message, numbers: phone10
            }, {
                headers: { 'authorization': fast2smsKey, 'Content-Type': 'application/json' }
            });
            if (res.data && res.data.return === true) return { success: true, provider: 'fast2sms' };
        } catch (err) { console.warn(`[SMS] Fast2SMS failed: ${err.message}`); }
    }
    return { success: false };
}

const games = [
    { id: 1, emoji: '♟️', name: 'Chess Set Pro', brand: 'ChessKing™', cat: 'indoor', price: 149, rating: 4.9, avail: true, players: '2', age: '6+', deposit: 500 },
    { id: 2, emoji: '🎯', name: 'Carrom Board', brand: 'Precise™', cat: 'indoor', price: 179, rating: 4.8, avail: true, players: '4', age: '5+', deposit: 600 },
    { id: 3, emoji: '🎱', name: 'Mini Billiards Table', brand: 'BallRoom™', cat: 'indoor', price: 399, rating: 4.7, avail: false, players: '2-4', age: '12+', deposit: 1500 },
    { id: 4, emoji: '🎳', name: 'Bowling Set', brand: 'StrikeKing™', cat: 'indoor', price: 199, rating: 4.6, avail: true, players: '2-6', age: '5+', deposit: 700 },
    { id: 5, emoji: '🏓', name: 'Table Tennis Table', brand: 'Stag™', cat: 'indoor', price: 349, rating: 4.9, avail: true, players: '2-4', age: '7+', deposit: 1200 },
    { id: 6, emoji: '🎮', name: 'Air Hockey Table', brand: 'FunZone™', cat: 'indoor', price: 449, rating: 4.8, avail: true, players: '2', age: '6+', deposit: 1500 },
    { id: 7, emoji: '🎲', name: 'Giant Jenga', brand: 'WoodCraft™', cat: 'indoor', price: 149, rating: 4.7, avail: true, players: '2-8', age: '4+', deposit: 500 },
    { id: 8, emoji: '🃏', name: 'UNO Card Set', brand: 'Mattel™', cat: 'indoor', price: 99, rating: 4.9, avail: true, players: '2-10', age: '7+', deposit: 300 },
    { id: 9, emoji: '🎡', name: 'Foosball Table', brand: 'Champion™', cat: 'indoor', price: 399, rating: 4.8, avail: false, players: '2-4', age: '8+', deposit: 1400 },
    { id: 10, emoji: '🎰', name: 'Spin Top Battle Set', brand: 'SpinMaster™', cat: 'indoor', price: 129, rating: 4.6, avail: true, players: '2+', age: '5+', deposit: 400 },
    { id: 26, emoji: '⚽', name: 'Football (Size 5)', brand: 'Nivia™', cat: 'outdoor', price: 149, rating: 4.9, avail: true, players: '2-22', age: '5+', deposit: 500 },
    { id: 27, emoji: '🏸', name: 'Badminton Set (2 Rackets)', brand: 'Yonex™', cat: 'outdoor', price: 199, rating: 4.8, avail: true, players: '2-4', age: '7+', deposit: 700 },
    { id: 30, emoji: '🏏', name: 'Cricket Bat Full Size', brand: 'SG™', cat: 'outdoor', price: 229, rating: 4.8, avail: true, players: '2-22', age: '8+', deposit: 800 },
    { id: 31, emoji: '🏒', name: 'Cricket Set Full Kit', brand: 'MRF™', cat: 'outdoor', price: 349, rating: 4.9, avail: true, players: '2-22', age: '8+', deposit: 1200 },
    { id: 46, emoji: '🎲', name: 'Ludo Deluxe', brand: 'FunZone™', cat: 'board', price: 119, rating: 4.8, avail: true, players: '2-4', age: '5+', deposit: 400 },
    { id: 52, emoji: '💰', name: 'Monopoly Classic', brand: 'Hasbro™', cat: 'board', price: 149, rating: 4.9, avail: true, players: '2-8', age: '8+', deposit: 500 },
    { id: 81, emoji: '🎮', name: 'PlayStation 5', brand: 'Sony™', cat: 'console', price: 699, rating: 4.9, avail: true, players: '1-4', age: '12+', deposit: 3000 },
    { id: 92, emoji: '✈️', name: 'Drone DJI Mini 3', brand: 'DJI™', cat: 'toy', price: 599, rating: 4.9, avail: true, players: '1', age: '14+', deposit: 2500 }
];

app.get('/', (_req, res) => res.send('RentPlay API is Running!'));

app.get('/api/search', async (req, res) => {
    const query = (req.query.q || '').toLowerCase();
    try {
        if (!query) {
            const result = await pool.query("SELECT * FROM items ORDER BY id ASC");
            return res.json(result.rows.length > 0 ? result.rows : games);
        }
        const searchValue = `%${query}%`;
        const result = await pool.query(
            "SELECT * FROM items WHERE LOWER(name) LIKE $1 OR LOWER(brand) LIKE $1 OR LOWER(cat) LIKE $1 ORDER BY id ASC",
            [searchValue]
        );
        if (result.rows.length > 0) return res.json(result.rows);
        const fallback = games.filter(g =>
            g.name.toLowerCase().includes(query) ||
            g.brand?.toLowerCase().includes(query) ||
            g.cat?.toLowerCase().includes(query)
        );
        res.json(fallback);
    } catch (err) {
        console.error("Search Error:", err.message);
        res.json(games.filter(g => g.name.toLowerCase().includes(query)));
    }
});

app.get('/api/items', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM items ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) { res.json(games); }
});

app.get('/api/stores', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM stores WHERE status = 'active' ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/book', async (req, res) => {
    const { userName, userPhone, userEmail, itemName, address, price, days, bookingDate, bookingTime, bookingDay, paymentMode, signature, lat, lng } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO rentals (name, item, phone, address, price, days, booking_date, booking_time, booking_day, payment_mode, status, email, signature, lat, lng) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, $13, $14) RETURNING id`,
            [userName, itemName, userPhone, address, parseInt(price.toString().replace(/\D/g,'')) || 0, parseInt(days) || 1, bookingDate, bookingTime, bookingDay, paymentMode, userEmail, signature, lat, lng]
        );
        res.json({ success: true, bookingId: result.rows[0].id });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/db/:table', async (req, res) => {
    const { table } = req.params;
    const allowed = ['rentals', 'items', 'delivery_boys', 'stores', 'reviews', 'support_requests'];
    if (!allowed.includes(table)) return res.status(400).json({ error: "Invalid table" });
    try {
        const result = await pool.query(`SELECT * FROM ${table} ORDER BY 1 DESC LIMIT 1000`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/delivery-boys', async (req, res) => {
    try {
        // Return active and pending for demo purposes
        const result = await pool.query("SELECT * FROM delivery_boys ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/register-delivery', async (req, res) => {
    const {
        first_name, last_name, dob, gender, mobile, alternate_mobile, email,
        assigned_store_id, address, city, state, pincode, landmark,
        vehicle_type, vehicle_brand, vehicle_model, registration_number,
        year_of_manufacture, insurance_valid_until, fuel_type, ownership,
        work_type, experience, delivery_zones, time_slots, expected_salary,
        languages, emergency_name, emergency_relationship, emergency_mobile,
        bank_holder_name, account_number, ifsc_code, bank_name, upi_id, payment_preference
    } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO delivery_boys 
            (first_name, last_name, dob, gender, mobile, alternate_mobile, email,
             assigned_store_id, address, city, state, pincode, landmark,
             vehicle_type, vehicle_brand, vehicle_model, registration_number,
             year_of_manufacture, insurance_valid_until, fuel_type, ownership,
             work_type, experience, delivery_zones, time_slots, expected_salary,
             languages, emergency_name, emergency_relationship, emergency_mobile,
             bank_holder_name, account_number, ifsc_code, bank_name, upi_id, payment_preference,
             status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
                    $22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,'active')
            RETURNING id`,
            [first_name, last_name, dob || null, gender, mobile, alternate_mobile, email,
             assigned_store_id || null, address, city, state, pincode, landmark,
             vehicle_type, vehicle_brand, vehicle_model, registration_number,
             year_of_manufacture, insurance_valid_until || null, fuel_type, ownership,
             work_type, experience, delivery_zones, time_slots, expected_salary || null,
             languages, emergency_name, emergency_relationship, emergency_mobile,
             bank_holder_name, account_number, ifsc_code, bank_name, upi_id, payment_preference]
        );
        res.json({ success: true, partnerId: result.rows[0].id });
    } catch (err) {
        console.error('[Register Delivery]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/delivery-requests', async (req, res) => {
    const { storeId } = req.query;
    try {
        if (!storeId || storeId === 'null') {
            const result = await pool.query("SELECT * FROM rentals WHERE status = 'pending'");
            return res.json(result.rows);
        }
        
        const storeResult = await pool.query("SELECT lat, lng FROM stores WHERE id = $1", [storeId]);
        if (storeResult.rows.length === 0) return res.json([]);
        const store = storeResult.rows[0];
        
        const result = await pool.query(`
            SELECT *, 
              ( 6371 * acos( cos( radians($1) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians($2) ) + sin( radians($1) ) * sin( radians( lat ) ) ) ) AS distance 
            FROM rentals 
            WHERE status = 'pending' AND lat IS NOT NULL AND lng IS NOT NULL
        `, [store.lat, store.lng]);
        
        // Filter for distance <= 20 (kilometers)
        const nearby = result.rows.filter(r => r.distance <= 20);
        res.json(nearby);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/accept-delivery/:id', async (req, res) => {
    const { id } = req.params;
    const { partnerId, partnerName, partnerPhone } = req.body;
    try {
        // Atomic update to ensure only one delivery boy gets it
        const result = await pool.query(`
            UPDATE rentals 
            SET status = 'assigned', track_status = 'assigned', delivery_boy_name = $1, delivery_boy_phone = $2 
            WHERE id = $3 AND status = 'pending' 
            RETURNING *
        `, [partnerName, partnerPhone, id]);
        
        if (result.rows.length > 0) {
            res.json({ success: true, order: result.rows[0] });
        } else {
            res.json({ success: false, message: 'Request already accepted by another partner.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/my-trips', async (req, res) => {
    const { partnerId } = req.query;
    try {
        // Since we didn't save partnerId in rentals, we look up the partner's phone
        const partnerRes = await pool.query("SELECT mobile FROM delivery_boys WHERE id = $1", [partnerId]);
        if (partnerRes.rows.length === 0) return res.json([]);
        const phone = partnerRes.rows[0].mobile;

        const result = await pool.query("SELECT * FROM rentals WHERE delivery_boy_phone = $1 AND status != 'delivered' AND status != 'returned' ORDER BY id DESC", [phone]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-tracking/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query("UPDATE rentals SET track_status = $1 WHERE id = $2 RETURNING *", [status, id]);
        res.json({ success: true, order: result.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/booking-status/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT status, track_status, delivery_boy_name, delivery_boy_phone FROM rentals WHERE id = $1", [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/db-explorer', (req, res) => res.sendFile(path.join(__dirname, 'db_explorer.html')));

app.use(express.static('./'));

const PORT = 3005; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server on http://localhost:${PORT}`);
});
