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

// AUTH verification
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    jwt.verify(authHeader.split(' ')[1], process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2bong.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const theBoltsDB = client.db('the-bolts');
        const boltsCollection = theBoltsDB.collection('bolts');
        const usersCollection = theBoltsDB.collection('users');
        const reviewsCollection = theBoltsDB.collection('reviews');
        const ordersCollection = theBoltsDB.collection('orders');

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
        // get bolt by id
        app.get('/bolt/:id', async (req, res) => {
            let id = req.params.id;
            id = id.length === 24 ? id : '000000000000000000000000';
            const query = { _id: ObjectId(id) };
            const bolt = await boltsCollection.findOne(query);
            res.send(bolt);
        })

        app.post('/addbolt', async (req, res) => {

            const bolt = req.body;
            console.log(bolt);
            const result = await boltsCollection.insertOne(bolt);
            res.send(result);


        })

        app.put('/boltup/:id', async (req, res) => {
            const filter = { _id: ObjectId(req.params.id) };
            const Available = req.body;
            const updatedQuantity = {
                $set: Available
            };
            const options = { upsert: true };
            const upResult = await boltsCollection.updateOne(filter, updatedQuantity, options);

        })
        app.get('/order/:id', async (req, res) => {
            let id = req.params.id;
            id = id.length === 24 ? id : '000000000000000000000000';
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            res.send(order);
        })

        // get latest 6 reviews
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({}).sort({ _id: -1 }).limit(6);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        //add review
        app.post('/addreview', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        })

        //add new order
        app.post('/order', async (req, res) => {
            const [order, available] = (req.body);

            const filter = { _id: ObjectId(order.boltID) };
            const updatedQuantity = {
                $set: {
                    Available: available
                }
            };
            const options = { upsert: true };
            const upResult = await boltsCollection.updateOne(filter, updatedQuantity, options);

            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })
        app.put('/orderStatus/:id', async (req, res) => {
            const filter = { _id: ObjectId(req.params.id) };
            const status = req.body;
            const data = {
                $set: status
            }
            const options = { upsert: true };
            const result = await ordersCollection.updateOne(filter, data, options);
            res.send(result);
        })

        // order by email
        app.get('/myorders/:email', verifyJWT, async (req, res) => {
            if (req.decoded.email === req.params.email) {
                const query = { uEmail: req.params.email };
                const cursor = ordersCollection.find(query).sort({ _id: -1 });
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }
        })

        app.put('/user', async (req, res) => {
            const [name, email] = req.body;
            const filter = { email: email };
            const data = {
                $set: {
                    name: name,
                    email: email
                }
            }
            const options = { upsert: true };
            const result = await usersCollection.updateOne(filter, data, options);
            res.send(result);
        })

        // get all users
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({}).sort({ _id: -1 });
            const users = await cursor.toArray();
            res.send(users);
        })
        // get all order
        app.get('/allorders', async (req, res) => {
            const cursor = ordersCollection.find({}).sort({ _id: -1 });
            const orders = await cursor.toArray();
            res.send(orders);
        })
        // get user by email
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            res.send(user);
        })

        app.put('/useradmin/:id', async (req, res) => {
            const filter = { _id: ObjectId(req.params.id) };
            const data = {
                $set: {
                    admin: true
                }
            }
            const options = { upsert: true };
            const result = await usersCollection.updateOne(filter, data, options);
            res.send(result);
        })

        app.delete('/bolt/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const result = await boltsCollection.deleteOne(query);
            res.send(result);
        })

        app.put('/user/:id', async (req, res) => {
            const id = req.params.id;
            const user = req.body;
            const filter = { _id: ObjectId(id) };
            const data = {
                $set: user
            }
            const options = { upsert: true };
            const result = await usersCollection.updateOne(filter, data, options);
            res.send(result);
        })


        // JWT generate
        app.post('/login', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '12h' });
            res.send({ token });
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