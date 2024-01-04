/*
 * This require() statement reads environment variable values from the file
 * called .env in the project directory.  You can set up the environment
 * variables in that file to specify connection information for your own DB
 * server.
 */
require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const multer = require("multer")
const crypto = require("node:crypto")

const api = require('./api')
const { connectToDb } = require('./lib/mongo')
const { connectToRabbitMQ, getChannel } = require('./lib/rabbitmq')

const app = express()
const port = process.env.PORT || 8000

const {
    getImageDownloadStreamByFilename
} = require('./models/photo')

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'))

const imageTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
}

app.use(express.json())

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = imageTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
        }
    }),
    fileFilter: (req, file, callback) => {
        callback(null, !!imageTypes[file.mimetype])
    }
})


app.get("/media/photos/:filename", function (req, res, next) {
    getImageDownloadStreamByFilename(req.params.filename)
        .on("error", function (err) {
            if (err.code === "ENOENT") {
                next()
            } else {
                next(err)
            }
        })
        .on("file", function (file) {
            res.status(200).type(file.metadata.contentType)
        })
        .pipe(res)
})


/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api)


app.use('*', function (req, res, next) {
    res.status(404).json({
        error: "Requested resource " + req.originalUrl + " does not exist"
    })
})



/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
    console.error("== Error:", err)
    res.status(500).send({
        err: "Server error.  Please try again later."
    })
})

connectToDb(async () => {
    await connectToRabbitMQ("photos")
    app.listen(port, function () {
        console.log("== Server is running on port", port)
    })
})
