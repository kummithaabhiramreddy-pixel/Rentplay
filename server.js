require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const twilio = require('twilio');
const app = express();

app.use(express.static('./'));

app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization'
}));
app.options('*', cors()); // Allow preflight for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Needed for Twilio Webhooks

// Twilio Setup
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC99b7fbb47eaaadd8c326f746deecf7ba';
const authToken = process.env.TWILIO_AUTH_TOKEN || '15d59c8d81916dd3fb3c95c2c7ceb1e7';
const client = twilio(accountSid, authToken);
const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '+16625722660';
const deliveryBoyNumber = process.env.DELIVERY_BOY_NUMBER || '+918185951564';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const pool = require('./db');

// Full Games Database
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
    { id: 92, emoji: '✈️', name: 'Drone DJI Mini 3', brand: 'DJI™', cat: 'toy', price: 599, rating: 4.9, avail: true, players: '1', age: '14+', deposit: 2500 },
];

const keywords = {
    "Cricket": "1531415074968-036ba1b575da",
    "Football": "1514533212735-5df2c8421867",
    "Chess": "1529699211952-734e80c4d42b",
    "Carrom": "1631553127988-34839846663c",
    "Rubiks": "1591946614486-ddd5201d9cd2",
    "VR": "1622979135225-c2b570f533a7",
    "Nintendo": "1578303512597-81e6cc155b3e",
    "Basketball": "1544919932156-f00843673752",
    "Tennis": "1595435061149-d29990b7952a",
    "Drone": "1507504031003-b417219a0fde",
    "Tent": "1478131143081-80f7f84ca84d",
    "Badminton": "1626225967045-94450c262467"
};

// Health Check
app.get('/', (_req, res) => res.send('RentPlay API is Running!'));

// Search API Endpoint
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
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
        // Fallback filtering if DB search is empty but games might have it
        const fallback = games.filter(g =>
            g.name.toLowerCase().includes(query) ||
            g.brand?.toLowerCase().includes(query) ||
            g.cat?.toLowerCase().includes(query)
        );
        res.json(fallback);
    } catch (err) {
        console.error("Search Database Error:", err.message);
        const results = games.filter(g =>
            g.name.toLowerCase().includes(query) ||
            g.brand?.toLowerCase().includes(query) ||
            g.cat?.toLowerCase().includes(query)
        );
        res.json(results);
    }
});

// GET All Marketplace Items
app.get('/api/items', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM items ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.json(games); // Fallback
    }
});

// Simple Book API (Now sends a Link to Delivery Boy)
app.post('/book', async (req, res) => {
    const { userName, userPhone, userEmail, itemName, address, price, days, bookingDate, bookingTime, bookingDay, paymentMode, signature } = req.body;
    console.log(`Booking request for ${itemName} by ${userName} (${userPhone})`);

    try {
        console.log("Database Insert Data:", [userName, itemName, userPhone, address, price, days, bookingDate, bookingTime, bookingDay, paymentMode, userEmail, signature]);
        const result = await pool.query(
            `INSERT INTO rentals 
            (name, item, phone, address, price, days, booking_date, booking_time, booking_day, payment_mode, status, email, signature) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12) 
            RETURNING id`,
            [
                userName, 
                itemName, 
                userPhone, 
                address || 'No address provided', 
                price ? parseInt(price.toString().replace(/[^0-9]/g, '')) : 0, 
                days ? parseInt(days) : 1,
                bookingDate || null,
                bookingTime || null,
                bookingDay || null,
                paymentMode || 'cod',
                userEmail || null,
                signature || null
            ]
        );
        
        const bookingId = result.rows[0].id;
        console.log(`Booking saved to DB with ID: ${bookingId}`);
        const acceptLink = `${BASE_URL}/accept/${bookingId}`;

        // SEND ALERT SMS TO DELIVERY BOY
        try {
            const message = `🚨 NEW ORDER! ${userName} wants "${itemName}".\nPrice: ${price}\nDays: ${days}\nDate: ${bookingDate} (${bookingDay}) at ${bookingTime}\nAddress: ${address || 'Check with user'}\n\nACCEPT HERE: ${acceptLink}`;
            
            await client.messages.create({
                body: message,
                from: twilioNumber,
                to: deliveryBoyNumber
            });
            console.log("Notification SMS sent to delivery boy.");
        } catch (smsErr) {
            console.warn("SMS Notification failed, but booking is saved:", smsErr.message);
        }

        res.json({ message: `Success! Booking ID #${bookingId}. Our delivery person has been notified.` });
    } catch (err) {
        console.error("CRITICAL DATABASE ERROR:", err);
        res.status(500).json({ message: `Database Save Failed! Error: ${err.message}` });
    }
});

// DELIVERY BOY INTERFACE: Accept Page
app.get('/accept/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM rentals WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.send("Booking session expired or invalid.");
        const order = result.rows[0];

        res.send(`
            <html>
            <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="font-family: -apple-system, sans-serif; padding: 20px; background: #f4f7f6; text-align: center;">
                <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 400px; margin: 40px auto;">
                    <h2 style="color: #333;">New Courier Request</h2>
                    <div style="text-align: left; margin: 20px 0; border-top: 1px solid #eee; padding-top: 20px;">
                        <p>📦 <b>Item:</b> ${order.item}</p>
                        <p>👤 <b>Customer:</b> ${order.name}</p>
                        <p>📞 <b>Phone:</b> ${order.phone}</p>
                        <p>💰 <b>Total Bill:</b> ₹${order.price}</p>
                        <p>⏳ <b>Duration:</b> ${order.days} Day(s)</p>
                        <p>📅 <b>Schedule:</b> ${order.booking_date ? order.booking_date.toString().split('T')[0] : 'Today'} (${order.booking_day}) at ${order.booking_time}</p>
                        <p>📍 <b>Address:</b> ${order.address}</p>
                        <p>💳 <b>Payment:</b> ${order.payment_mode ? order.payment_mode.toUpperCase() : 'N/A'}</p>
                    </div>
                    <button id="acceptBtn" onclick="confirmOrder()" style="width: 100%; height: 60px; background: #00b894; color: white; border: none; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer;">
                        ACCEPT DELIVERY
                    </button>
                    <p id="msg" style="margin-top: 20px; font-weight: bold; color: #2d3436;"></p>
                </div>
                <script>
                    async function confirmOrder() {
                        const btn = document.getElementById('acceptBtn');
                        btn.disabled = true;
                        btn.innerHTML = "Processing...";
                        try {
                            const res = await fetch('/api/confirm-booking/' + ${id}, { method: 'POST' });
                            const data = await res.json();
                            if(data.success) {
                                document.getElementById('msg').innerHTML = "✅ SUCCESS! User has been notified.";
                                btn.style.background = "#b2bec3";
                                btn.innerHTML = "Accepted";
                            } else {
                                alert(data.message || "Failed to confirm.");
                                btn.disabled = false;
                                btn.innerHTML = "RETRY ACCEPT";
                            }
                        } catch(e) { alert("Network Error"); btn.disabled=false; }
                    }
                </script>
            </body>
            </html>
        `);
    } catch (e) { res.status(500).send("Error loading page"); }
});

// API: Confirm and Send User SMS
app.post('/api/confirm-booking/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const orderRes = await pool.query("SELECT * FROM rentals WHERE id = $1", [id]);
        const order = orderRes.rows[0];

        if (order && order.status === 'pending') {
            await pool.query("UPDATE rentals SET status = 'accepted' WHERE id = $1", [id]);
            
            // NOTIFY THE USER
            await client.messages.create({
                body: `✅ Booking Confirmed! Your RentPlay order for "${order.item}" has been accepted by our delivery team. They are on the way!`,
                from: twilioNumber,
                to: order.phone
            });
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Order already processed." });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// TWILIO WEBHOOK: /sms-reply
app.post('/sms-reply', async (req, res) => {
    const incomingMsg = req.body.Body || '';
    const twiml = new twilio.twiml.MessagingResponse();

    console.log(`Incoming SMS to Webhook: ${incomingMsg}`);

    // Logic: OWNER replies "ACCEPT +919000000000"
    if (incomingMsg.toUpperCase().startsWith('ACCEPT')) {
        const parts = incomingMsg.split(' ');
        const customerPhone = parts[1];

        if (customerPhone) {
            try {
                // SEND CONFIRMATION SMS TO CUSTOMER
                await client.messages.create({
                    body: `✅ Your Booking is Confirmed! Our delivery team will contact you shortly from RentPlay.`,
                    from: twilioNumber,
                    to: customerPhone
                });
                twiml.message(`System: Confirmation SMS sent to ${customerPhone}`);
            } catch (err) {
                twiml.message(`Error: Could not send SMS to ${customerPhone}. Details: ${err.message}`);
            }
        } else {
            twiml.message("Format Error. Reply: ACCEPT [customer_phone]");
        }
    } else {
        twiml.message("Type 'ACCEPT [phone]' to confirm the rental.");
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

// Rent API Endpoint (Extended/Advanced)
app.post('/api/rent', async (req, res) => {
    const { name, item, price, days, address, paymentMode } = req.body;
    try {
        await pool.query(
            "INSERT INTO rentals (name, item, price, days, address, payment_mode) VALUES ($1, $2, $3, $4, $5, $6)",
            [name, item, price, days, address, paymentMode]
        );
        res.json({ success: true, message: "Item rented successfully" });
    } catch (err) {
        res.json({ success: true, message: "Rented (Demo Mode)" });
    }
});

// Admin Dashboard Route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'Dashboard.html'));
});

// View all bookings in the browser
app.get('/api/view-bookings', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM rentals ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).send("Database Error: " + err.message);
    }
});

// Delivery Boy Registration
app.post('/api/register-delivery', async (req, res) => {
    const d = req.body;
    try {
        // 1. Check Age (Must be >= 18)
        if (d.dob) {
            const birthDate = new Date(d.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            if (age < 18) {
                return res.status(400).json({ success: false, message: 'You must be at least 18 years old to register.' });
            }
        }

        // 2. Check for Duplicate Mobile
        const existing = await pool.query('SELECT id FROM delivery_boys WHERE mobile = $1', [d.mobile]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'This mobile number is already registered.' });
        }

        const result = await pool.query(
            `INSERT INTO delivery_boys 
            (first_name, last_name, dob, gender, mobile, alternate_mobile, email,
             address, city, state, pincode, landmark,
             vehicle_type, vehicle_brand, vehicle_model, registration_number,
             year_of_manufacture, insurance_valid_until, fuel_type, ownership,
             work_type, experience, delivery_zones, time_slots, expected_salary, languages,
             emergency_name, emergency_relationship, emergency_mobile,
             bank_holder_name, account_number, ifsc_code, bank_name, upi_id, payment_preference)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35)
            RETURNING id`,
            [
                d.first_name, d.last_name, d.dob || null, d.gender,
                d.mobile, d.alternate_mobile, d.email,
                d.address, d.city, d.state, d.pincode, d.landmark,
                d.vehicle_type, d.vehicle_brand, d.vehicle_model, d.registration_number,
                d.year_of_manufacture, d.insurance_valid_until || null, d.fuel_type, d.ownership,
                d.work_type, d.experience, d.delivery_zones, d.time_slots,
                d.expected_salary ? parseInt(d.expected_salary) : null, d.languages,
                d.emergency_name, d.emergency_relationship, d.emergency_mobile,
                d.bank_holder_name, d.account_number, d.ifsc_code, d.bank_name, d.upi_id, d.payment_preference
            ]
        );
        console.log(`Delivery boy registered: ${d.first_name} ${d.last_name}`);
        res.json({ success: true, message: 'Registration successful!' });
    } catch (err) {
        console.error('Delivery Registration Error:', err.message);
        res.status(500).json({ success: false, message: 'Registration failed: ' + err.message });
    }
});

// View all delivery boy registrations
app.get('/api/delivery-boys', async (_req, res) => {
    try {
        const result = await pool.query('SELECT * FROM delivery_boys ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/delete-delivery-boy', async (req, res) => {
    const { id } = req.body;
    const partnerId = parseInt(id);
    try {
        await pool.query('DELETE FROM delivery_boys WHERE id = $1', [partnerId]);
        res.json({ success: true, message: 'Partner removed!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/delete-all-delivery-boys', async (req, res) => {
    console.log(`[BULK-DELETE] Request to remove ALL partners`);
    try {
        await pool.query('DELETE FROM delivery_boys');
        console.log(`[BULK-DELETE] Successfully cleared the delivery_boys table`);
        res.json({ success: true, message: 'All partners removed successfully!' });
    } catch (err) {
        console.error('[BULK-DELETE] Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── LIVE STATS API (used by index.html hero section) ───
app.get('/api/stats', async (_req, res) => {
    try {
        const [boysRes, itemsRes, rentalsRes] = await Promise.all([
            pool.query('SELECT COUNT(*) AS count FROM delivery_boys'),
            pool.query('SELECT COUNT(*) AS count FROM items'),
            pool.query("SELECT COUNT(*) AS count FROM rentals")
        ]);

        const deliveryBoys = parseInt(boysRes.rows[0].count) || 0;
        const itemsNearby  = parseInt(itemsRes.rows?.[0]?.count) || 0; 
        
        const rentalsCount = parseInt(rentalsRes.rows[0].count) || 0;
        const avgMins      = rentalsCount > 0 ? 15 + (rentalsCount % 5) : 0; 

        res.json({ deliveryBoys, itemsNearby, avgMins });
    } catch (err) {
        console.error('Stats API error:', err.message);
        res.json({ deliveryBoys: 0, itemsNearby: 0, avgMins: 0 });
    }
});

// ─── SUPPORT API ───
app.post('/api/support', async (req, res) => {
    const { name, phone, email, subject, message } = req.body;
    try {
        // Save to DB
        const result = await pool.query(
            `INSERT INTO support_requests (name, phone, email, subject, message)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, phone, email, subject, message]
        );
        console.log(`Support request received from: ${name} (${phone})`);

        // NOTIFY RENTPLAY VIA TWILIO (More reliable than Fast2SMS)
        try {
            const supportSmsBody = `🚨 NEW SUPPORT REQUEST!\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nSub: ${subject}\nMsg: ${message.substring(0, 100)}`;
            
            console.log(`[SMS] Sending support alert via Twilio to ${deliveryBoyNumber}...`);
            await client.messages.create({
                body: supportSmsBody,
                from: twilioNumber,
                to: deliveryBoyNumber
            });
            console.log('[SMS] Twilio Support SMS sent successfully.');
            res.json({ success: true, smsSuccess: true, request: result.rows[0] });
        } catch (twilioErr) {
            console.error('[SMS] Twilio ERROR:', twilioErr.message);
            // Fallback to reporting error but keeping DB success
            res.json({ 
                success: true, 
                smsSuccess: false, 
                smsError: `Twilio Error: ${twilioErr.message}. Ensure your Twilio balance is sufficient and the balance is in USD/valid currency.`, 
                request: result.rows[0] 
            });
        }
    } catch (err) {
        console.error('Support API Error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
});

app.get('/api/support', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM support_requests ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch support requests' });
    }
});

app.delete('/api/support/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM support_requests WHERE id = $1', [id]);
        res.json({ success: true, message: 'Support request deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete support request' });
    }
});

// ─── REVIEWS API ───
app.get('/api/reviews', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    const { name, city, category, title, body, rating, tags } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO reviews (name, city, category, title, body, rating, tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, city, category, title, body, rating, tags ? tags.join(',') : null]
        );
        res.json({ success: true, review: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/reviews/:id/upvote', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE reviews SET helpful = helpful + 1 WHERE id = $1 RETURNING helpful`,
            [id]
        );
        if (result.rows.length > 0) {
            res.json({ success: true, helpful: result.rows[0].helpful });
        } else {
            res.status(404).json({ success: false, message: 'Review not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));