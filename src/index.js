const express = require('express')
const uppy = require('uppy-server')
const bodyParser = require('body-parser')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
require('dotenv').config()
const DATA_DIR = path.join(__dirname, 'tmp')
const app = express()

app.use(require('cors')({
    origin: true,
    credentials: true
}))
app.use(require('cookie-parser')())
app.use(bodyParser.json())
app.use(session({
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: 'some--super-secret',
    resave: true,
    saveUninitialized: true
}))

// Routes
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    res.send('Welcome to my uppy server')
})

// initialize uppy
const uppyOptions = {
    providerOptions: {
        // google: {
        //     key: 'your google key',
        //     secret: 'your google secret'
        // },
        // instagram: {
        //     key: 'your instagram key',
        //     secret: 'your instagram secret'
        // },
        s3: {
            getKey: (req, filename) =>
                `whatever/${Math.random().toString(32).slice(2)}/${filename}`, // todo need to figure out ...
            key: process.env.AWS_ACCESS_KEY_ID,
            secret: process.env.AWS_SECRET_ACCESS_KEY,
            bucket: process.env.AWS_BUCKET,
            region: process.env.AWS_REGION
        }
        // you can also add options for dropbox here
    },
    server: {
        host: 'localhost:3020',
        protocol: 'http'
    },
    filePath: DATA_DIR,
    secret: 'some-secret',
    debug: true
}

// Create the data directory here for the sake of the example.
try {
    fs.accessSync(DATA_DIR)
} catch (err) {
    fs.mkdirSync(DATA_DIR)
}
process.on('exit', function () {
    rimraf.sync(DATA_DIR)
})

app.use(uppy.app(uppyOptions))

// handle 404
app.use((req, res, next) => {
    return res.status(404).json({message: 'Not Found'})
})

// handle server errors
app.use((err, req, res, next) => {
    console.error('\x1b[31m', err.stack, '\x1b[0m')
    res.status(err.status || 500).json({message: err.message, error: err})
})

uppy.socket(app.listen(3020), uppyOptions)

console.log('Welcome to Uppy Server!')
console.log(`Listening on http://localhost:${3020}`)