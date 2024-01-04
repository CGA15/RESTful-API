/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')
const multer = require("multer")
const crypto = require("node:crypto")
const fs = require("node:fs/promises")



const { validateAgainstSchema } = require('../lib/validation')
const { connectToRabbitMQ, getChannel } = require('../lib/rabbitmq')
const {
    PhotoSchema,
    insertNewPhoto,
    getPhotoById,
    getImageInfoById
} = require('../models/photo')

const router = Router()

const imageTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

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

/*
 * POST /photos - Route to create a new photo.
 */
router.post('/', upload.single("image"), async (req, res, next) => {
    console.log("  -- req.file:", req.file)
    console.log("  -- req.body:", req.body)
    if (validateAgainstSchema(req.body, PhotoSchema) || 1==1 ) {
        try {

            const image = {
                contentType: req.file.mimetype,
                filename: req.file.filename,
                path: req.file.path,
                businessId: req.body.businessId,
                caption: req.body.caption
            }
            const id = await insertNewPhoto(image)

            const channel = getChannel()
            channel.sendToQueue("photos", Buffer.from(id.toString()))
            await fs.unlink(req.file.path)

            res.status(201).send({
                id: id
            })

        } catch (err) {
            next(err)
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid photo object"
        })
    }

})

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {

    try {
        const photo = await getImageInfoById(req.params.id)
        if (photo) {
            const resBody = {
                _id: photo._id,
                businessId: photo.businessId,
                caption: photo.caption,
                filename: photo.filename,
                contentType: photo.metadata.contentType,
                url: `/media/photos/${photo.id}`
            }
            res.status(200).send(resBody)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

module.exports = router


