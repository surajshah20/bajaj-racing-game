require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to Neon PostgreSQL database successfully!');
  release();
});

app.get('/', (req, res) => {
  res.send('Bajaj Dashain Racing API is running');
});

// Fetch all active rewards
app.get('/api/rewards', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rewards WHERE active = TRUE ORDER BY score_requirement DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rewards:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit race result and generate voucher
app.post('/api/races', async (req, res) => {
  const { score, speedKmh } = req.body;
  
  try {
    // Simple server-side validation
    if (score === undefined || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    // Determine reward tier based on project plan rules
    let rewardTier = 'Participation Badge';
    if (score >= 10000) rewardTier = 'Premium Merchandise';
    else if (score >= 7000) rewardTier = '20% Service Voucher';
    else if (score >= 4000) rewardTier = 'Bajaj Keyring';

    // Generate a random voucher code (e.g., BDX-A7K9)
    const voucherCode = `BDX-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Insert into database (assuming you have a race_results table)
    // const result = await pool.query(
    //   'INSERT INTO race_results (score, top_speed, reward_tier, voucher_code) VALUES ($1, $2, $3, $4) RETURNING *',
    //   [score, speedKmh, rewardTier, voucherCode]
    // );

    // For now, return the generated data directly to the client
    res.json({
      success: true,
      score: score,
      rewardTier: rewardTier,
      voucherCode: voucherCode
    });
  } catch (err) {
    console.error('Error submitting race:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});