const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5555;

app.use(cors());
app.use(express.json());

// handle OPTIONS as default method
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if ('OPTIONS' == req.method) {
        return res.sendStatus(200);
    } else {
        next();
    }
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2bong.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const theBoltsDB = client.db('the-bolts');
        const boltsCollection = theBoltsDB.collection('bolts');
        const usersCollection = theBoltsDB.collection('users');
        const reviewsCollection = theBoltsDB.collection('reviews');

        // get all bolts
        app.get('/bolts', async (req, res) => {
            const cursor = boltsCollection.find({}).sort({ _id: -1 });
            const bolts = await cursor.toArray();
            res.send(bolts);
        })
        // get latest 6 bolts
        app.get('/6bolts', async (req, res) => {
            const cursor = boltsCollection.find({}).sort({ _id: -1 }).limit(6);
            const bolts = await cursor.toArray();
            res.send(bolts);
        })

        // get latest 6 reviews
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({}).sort({ _id: -1 }).limit(6);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        // get all users
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })
    }
    finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('The Bolts Manufacturing');
})

app.listen(port, () => {
    console.log(`Listening on port ${port} for The Bolts`)
})