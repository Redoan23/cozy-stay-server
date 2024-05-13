const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000


app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const logger = (req, res, next) => {
    // console.log('log-info:', req.method, req.url)
    next()
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.Token
    // console.log('the middleware token is', token)
    if (!token) {
        return res.status(401).send({ message: 'Access Unauthorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }

        req.user = decoded
        // console.log(decoded)
        next()
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qlopamb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const roomCollection = client.db('hotelDB').collection('room-details')
        const usersBookedCollection = client.db('hotelDB').collection('booked-rooms-by-user')
        const reviewCollection = client.db('hotelDB').collection('review-collection')

        app.get('/rooms/filter', async (req, res) => {
            const from = parseInt(req.query.from)
            const to = parseInt(req.query.to)
            // console.log(from, to)
            const result = await roomCollection.find({ ppn: { $gte: from, $lte: to } }).toArray()
            res.send(result)
        })

        app.get('/rooms', async (req, res) => {
            const result = await roomCollection.find().toArray()
            res.send(result)
        })

        app.get('/rooms/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await roomCollection.findOne(query)
            // console.log(result)
            res.send(result)
        })

        // booking list management 

        app.get('/booked/user', logger, verifyToken, async (req, res) => {
            console.log(req.cookies)
            console.log('the token owner is', req.user)
            console.log(req.query.email)
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: ' access denied' })
            }
            const result = await usersBookedCollection.find().toArray()
            res.send(result)
        })

        app.post('/booked/user', async (req, res) => {
            const data = req.body
            const result = await usersBookedCollection.insertOne(data)
            res.send(result)
        })

        app.put('/booked/user/:id', async (req, res) => {
            const id = req.params.id
            const updatedDate = req.body.date
            console.log(updatedDate)
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    startDate: updatedDate
                }
            }
            const result = await usersBookedCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

        app.delete('/booked/user/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await usersBookedCollection.deleteOne(query)
            res.send(result)
        })

        app.put('/rooms/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            console.log(data)
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    availability: data?.availability === 'Not Available' ? 'yes' : 'Not Available'
                }
            }
            const result = await roomCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        // this is for the review collection

        app.post('/user/review', verifyToken, async (req, res) => {
            const review = req.body.reviewData
            console.log(review)
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: ' access denied' })
            }
            const result = await reviewCollection.insertOne(review)
            res.send(result)
        })

        app.get('/user/review/:id', async (req, res) => {
            const id = req.params.id
            const query = { reviewId: id }
            const reviews = await reviewCollection.find(query).toArray()
            res.send(reviews)
        })
        app.get('/user/review', async (req, res) => {
            const reviews = await reviewCollection.find().toArray()
            res.send(reviews)
        })


        // json webtoken part

        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.cookie('Token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })

            res.send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body
            // console.log('loggihg out user', user)
            res.clearCookie('Token', { maxAge: 0 }).send({ success: true })
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Cozy Stay server working properly')
})

app.listen(port, () => {
    console.log(`listening to the port ${port}`)
})