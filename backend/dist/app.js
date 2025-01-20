import express from 'express';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import path from 'path';
import Redis from 'redis';
import AWS from 'aws-sdk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
AWS.config.update({
    region: 'eu-west-3' // Adjust as needed
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const app = express();
app.set('trust proxy', 1);
app.use(bodyParser.json());
const client = Redis.createClient({
    socket: {
        host: '13.36.217.215',
        port: 6379
    },
    password: 'x8C39DVF11Istc6'
});
client.connect();
client.on('ready', () => console.log('Redis is ready to accept commands'));
client.on('end', () => console.log('Connection to Redis has been closed'));
async function initializeTileCount() {
    const exists = await client.exists('globalTileCount');
    if (!exists)
        await client.set('globalTileCount', 0);
}
app.use(express.static('../public'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public', 'index.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, '../public', 'privacy-policy.html')));
const tileLimiter = rateLimit({
    windowMs: 1000,
    max: 2,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ message: "Too many requests, please try again later." })
});
const setupGoogleSheetsClient = async () => {
    const auth = new GoogleAuth({
        keyFilename: 'tab2trees-bbc09faca3e8.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const client = (await auth.getClient());
    const sheets = google.sheets({ version: 'v4', auth: client });
    return sheets;
};
async function updateTabCount(userId) {
    console.log("updating user id", userId);
    const params = {
        TableName: 'UserStats',
        Key: { user_id: userId }, // Make sure 'user_id' is the correct key name
        UpdateExpression: 'SET tab_Count = if_not_exists(tab_Count, :start) + :inc',
        ExpressionAttributeValues: {
            ':inc': 1,
            ':start': 0
        },
        ReturnValues: 'UPDATED_NEW'
    };
    return dynamoDB.update(params).promise();
}
async function updateCoins(userId, coinChange) {
    const params = {
        TableName: 'UserStats',
        Key: { user_id: userId },
        UpdateExpression: 'SET coin_count = if_not_exists(coin_count, :start) + :inc',
        ExpressionAttributeValues: {
            ':inc': coinChange,
            ':start': 0
        },
        ReturnValues: 'UPDATED_NEW'
    };
    return dynamoDB.update(params).promise();
}
app.use(cors());
app.post('/api/add-tab', tileLimiter, async (req, res) => {
    var _a;
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    try {
        let userData = await updateTabCount(userId);
        let userCount = (_a = userData.Attributes) === null || _a === void 0 ? void 0 : _a.tab_Count;
        const newCount = await client.incrBy('globalTileCount', parseInt(req.body.count || 1));
        res.json({ userCount: userCount, globalTileCount: newCount });
    }
    catch (error) {
        console.error('DynamoDB Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/api/user', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    try {
        const params = {
            TableName: 'UserStats',
            Key: { user_id: userId }
        };
        const data = await dynamoDB.get(params).promise();
        if (data.Item) {
            res.json(data.Item);
        }
        else {
            // Create new user entry with default values
            const newUser = {
                user_id: userId,
                tab_Count: 0,
                coin_count: 0
            };
            await dynamoDB.put({
                TableName: 'UserStats',
                Item: newUser
            }).promise();
            res.json(newUser);
        }
    }
    catch (error) {
        console.error('DynamoDB Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/updateCoins', tileLimiter, async (req, res) => {
    var _a;
    const { userId, newCoin } = req.body;
    try {
        let data = await updateCoins(userId, newCoin);
        res.json({ message: 'Coins added successfully.', coinCount: (_a = data.Attributes) === null || _a === void 0 ? void 0 : _a.coin_count });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/tiles', async (req, res) => {
    try {
        const globalTileCount = await client.get('globalTileCount');
        res.json({ globalTileCount: parseInt(globalTileCount) });
    }
    catch (error) {
        console.error('Redis Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/api/get-first-entry', (req, res) => {
    const params = {
        TableName: 'UserStats',
        Limit: 1 // Limits the returned items to 1
    };
    dynamoDB.scan(params, (err, data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            res.status(500).send('Error fetching data from DynamoDB');
        }
        else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            if (data.Items) {
                res.json(data.Items[0]); // Send the first item
            }
            else {
                console.log("Couldn't find any entry");
            }
        }
    });
});
app.post('/api/feedback', async (req, res) => {
    const { username, rating, feedbackType, feedbackText } = req.body;
    try {
        const sheets = await setupGoogleSheetsClient();
        const spreadsheetId = '1Efyws-asG18ufQIDJgR7Ek3waivhsdYLrW3XcF7nukc'; // Replace with your actual spreadsheet ID
        const range = 'Feedback!A:E';
        const valueInputOption = 'USER_ENTERED';
        const values = [
            [new Date().toISOString(), username, rating, feedbackType, feedbackText]
        ];
        const request = {
            spreadsheetId,
            range,
            valueInputOption,
            resource: {
                values
            },
        };
        await sheets.spreadsheets.values.append(request);
        res.status(200).send('Feedback recorded successfully');
    }
    catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).send('Error saving feedback');
    }
});
app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));
//# sourceMappingURL=app.js.map