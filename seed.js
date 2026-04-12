const pool = require('./db');
async function seedFn() {
  try {
    await pool.query(`INSERT INTO reviews (name, city, category, title, body, rating, tags, helpful) VALUES
    ('Kavya S.', 'Hyderabad', 'Board Games', 'Fantastic Monopoly Night!', 'Rented out the Monopoly Original board game for a weekend sleepover with friends. It arrived right on time, properly sanitized, and had all pieces intact! Very smooth checkout process too!', 5, 'Fast Delivery,Great Condition,Board Games', 12),
    ('Arjun Patel', 'Bangalore', 'Sports Equipment', 'Good quality cricket kit', 'The GM cricket bat and the rest of the kit were in excellent state. The only reason I am giving 4 stars instead of 5 is because the delivery guy was 15 minutes late, but otherwise an amazing experience.', 4, 'Good Quality,Outdoor', 8),
    ('Neha R', 'Mumbai', 'Gaming Consoles', 'PS5 works flawlessly', 'Had an intense gaming weekend. The console and controllers worked perfectly without any drift. I wish the rental price was slightly lower for 3 days but I absolutely loved the experience.', 5, 'Gaming,Great Condition', 24),
    ('Rohan Das', 'Delhi', 'Outdoor / Adventure', 'Decent Tent, little old', 'The 4-person tent served the purpose well for our trek. One of the zips was slightly sticky but they gave me it for a discounted rate so no major complaints.', 3, 'Decent,Camping', 2)`);
    console.log('Seeded successfully!');
  } catch(e) {
    console.error('Seed error', e);
  }
  process.exit(0);
}
seedFn();
