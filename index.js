const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const port = process.env.PORT || 5000

const app = express()
app.use(cors())

app.get('/', (req, res) => {
    res.send('Cozy Stay server working properly')
})

app.listen(port, () => {
    console.log(`listening to the port ${port}`)
})