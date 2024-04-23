const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());
const path = require('path');

const PORT = process.env.PORT || 3000;

// In-memory storage for the global count of tiles
let globalTileCount = 0;

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
app.post('/api/add-tree', tileLimiter, (req, res) => {
    const count = req.body.count || 1; // Default to 1 if no count is specified
    globalTileCount += count;
    res.json({ globalTileCount });
});

// GET handler to view the global tile count
app.get('/api/tiles', (req, res) => {
    res.json({ globalTileCount });
    // OR, if you want to keep it POST-only:
    // res.status(405).send("This endpoint requires a POST request.");
});

// GET handler to view the global tile count
app.get('/home', (req, res) => {
    res.json({ globalTileCount });
    // OR, if you want to keep it POST-only:
    // res.status(405).send("This endpoint requires a POST request.");
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
