const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());
const path = require('path');

const redis = require('redis');

const AWS = require('aws-sdk');

// Set the region; this is the only configuration needed if IAM roles are used
AWS.config.update({
  region: 'eu-west-3' // or your DynamoDB region
});

// DynamoDB example usage
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Create a client and connect to Redis server running on localhost:6379
// Create a client and connect to Redis server
const client = redis.createClient({
    socket: {
        host: '13.36.217.215',
        port: 6379
    },
    password: 'x8C39DVF11Istc6'
});

client.connect();

client.on('ready', function () {
    console.log('Redis is ready to accept commands');
});

client.on('end', function () {
    console.log('Connection to Redis has been closed');
});

// Example usage of the Redis client

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

async function updateTabCount(userId) {
    const params = {
        TableName: 'UserStats',
        Key: { user_id: userId },
        UpdateExpression: 'SET tab_count = if_not_exists(tab_count, :start) + :inc',
        ExpressionAttributeValues: {
            ':inc': 1,
            ':start': 0
        },
        ReturnValues: 'UPDATED_NEW'
    };
    return dynamoDB.update(params).promise();
}

app.use(cors());  // Place this before your routes are defined

// POST handler to increment and get the global tile count
app.post('/api/add-tab', tileLimiter, async (req, res) => {
    const { userId } = req.body.userId;
    const count = parseInt(req.body.count || 1); // Default to 1 if no count is specified
    try {
        await updateTabCount(userId);
        const newCount = await client.incrBy('globalTileCount', count); // Redis increments the count
        res.json({ globalTileCount: newCount });
    } catch (error) {
        console.error('Redis Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/updateCoins', tileLimiter, async (req, res) => {
    const { userId, coinChange } = req.body;
    try {
        await addCoins(userId, coinChange);
        res.json({ message: 'Coins added successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function addCoins(userId, coinsToAdd) {
    const params = {
        TableName: 'UserStats',
        Key: { user_id: userId },
        UpdateExpression: 'SET coin_count = if_not_exists(coin_count, :start) + :inc',
        ExpressionAttributeValues: {
            ':inc': coinsToAdd,
            ':start': 0
        },
        ReturnValues: 'UPDATED_NEW'
    };
    return dynamoDb.update(params).promise();
}

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

app.get('/api/get-first-entry', (req, res) => {
    const params = {
        TableName: 'UserStats',
        Limit: 1  // Limits the returned items to 1
    };

    dynamoDB.scan(params, (err, data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            res.status(500).send('Error fetching data from DynamoDB');
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            res.json(data.Items[0]); // Send the first item
        }
    });
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
