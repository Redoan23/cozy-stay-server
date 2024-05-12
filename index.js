const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())




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

        app.get('/booked/user', async (req, res) => {
            const result = await usersBookedCollection.find().toArray()
            res.send(result)
        })

        app.post('/booked/user', async (req, res) => {
            const data = req.body
            console.log(data)
            const result = await usersBookedCollection.insertOne(data)
            res.send(result)
        })

        app.put('/rooms/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    availability: 'Not Available'
                }
            }
            const result = await roomCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
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