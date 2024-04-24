const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());
const path = require('path');

const redis = require('redis');

// Create a client and connect to Redis server running on localhost:6379
const client = redis.createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

client.connect();

// Example usage of the Redis client
async function testRedis() {
    await client.set('test', 'value');
    const value = await client.get('test');
    console.log(value);  // Outputs: value
}

testRedis();
initializeTileCount();

const PORT = process.env.PORT || 3000;

// In-memory storage for the global count of tiles

async function initializeTileCount() {
    const exists = await client.exists('globalTileCount');
    if (!exists) {
        await client.set('globalTileCount', 0); // Set to 0 or to an initial value
    }
}

app.use(express.static('public'));
// Additional routes could also be here
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});


// Rate limit for the /api/tiles endpoint
const tileLimiter = rateLimit({
    windowMs: 1000,  // 1 second
    max: 2,  // limit each IP to 3 requests per windowMs
    standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
    handler: function (req, res) {  // handler to call when a user hits the rate limit
        res.status(429).json({
            message: "Too many requests, please try again later."
        });
    }
});

app.use(cors());  // Place this before your routes are defined

// POST handler to increment and get the global tile count
app.post('/api/add-tree', tileLimiter, async (req, res) => {
    const count = parseInt(req.body.count || 1); // Default to 1 if no count is specified
    try {
        const newCount = await client.incrby('globalTileCount', count); // Redis increments the count
        res.json({ globalTileCount: newCount });
    } catch (error) {
        console.error('Redis Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET handler to view the global tile count
app.get('/api/tiles', async (req, res) => {
    try {
        const globalTileCount = await client.get('globalTileCount');
        res.json({ globalTileCount: parseInt(globalTileCount) });
    } catch (error) {
        console.error('Redis Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Payment simulation endpoint
app.post('/api/purchase', (req, res) => {
    const { item, amount } = req.body;
    console.log(`Purchase made for ${item} costing ${amount}`);
    res.json({ success: true, message: `Purchase successful for ${item}` });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
