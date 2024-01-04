require("dotenv").config()
const { connectToDb, getDbReference } = require('./lib/mongo')
const { connectToRabbitMQ, getChannel } = require('./lib/rabbitmq')
const { getDownloadStreamById, updateImageTagsById, updateThumb } = require("./models/photo")
var Jimp = require("jimp");
const fs = require("node:fs")
const { ObjectId, GridFSBucket } = require('mongodb')



async function run () {

    await connectToRabbitMQ("photos")
    const channel = getChannel()

    channel.consume("photos", async msg => {
        if (msg) {

            const id = msg.content.toString()
            const downloadStream = getDownloadStreamById(id)

            const imageData = []
            downloadStream.on("data", function (data) {
                imageData.push(data)
            })
            downloadStream.on("end", async function () {
                const imgBuffer = Buffer.concat(imageData)
                const image = await Jimp.read(imgBuffer)
                const db = getDbReference()
                const bucket = new GridFSBucket(db, { bucketName: "photos" })
                
                const results = await bucket.find({ _id: new ObjectId(id) })
                .toArray()
                console.log("== results:", results)
                const thumbBuffer = await image.resize(100, 100).getBufferAsync(Jimp.MIME_JPEG)
                console.log("  -- thumbBuffer:", thumbBuffer)
                console.log("  -- id:", id)
              

               //Write ThumbBuffer to GridFS
               //const thumbId = await updateThumb(thumbBuffer, id)
               
            })
        }
        channel.ack(msg)
    })
}

connectToDb(async () => {
    await connectToRabbitMQ("photos")
    run()
})