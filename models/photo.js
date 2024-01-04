/*
 * Photo schema and data accessor methods.
 */

const { ObjectId, GridFSBucket } = require('mongodb')
const fs = require("node:fs")

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
    businessId: { required: true },
    caption: { required: false },
    file: {required: true}

}
exports.PhotoSchema = PhotoSchema

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {

    return new Promise(function (resolve, reject) {

        //photo = extractValidFields(photo, PhotoSchema)

        //photo.businessId = ObjectId(photo.businessId)
        const db = getDbReference()
        const bucket = new GridFSBucket(db, { bucketName: "photos" })
        const metadata = {
            contentType: photo.contentType,
            businessId: photo.businessId,
            caption: photo.caption
        }

        const uploadStream = bucket.openUploadStream(
            photo.filename,
            { metadata: metadata }
        )
        fs.createReadStream(photo.path).pipe(uploadStream)
            .on("error", function (err) {
                reject(err)
            })
            .on("finish", function (result) {
                console.log("== write success, result:", result)
                resolve(result._id)
        })
 
        //const collection = db.collection('photos')
        //const result =  collection.insertOne(photo)

        //return result.insertedId
    })
}
exports.insertNewPhoto = insertNewPhoto


exports.getImageInfoById = async function (id) {
    const db = getDbReference()
    // const collection = db.collection('images')
    const bucket = new GridFSBucket(db, { bucketName: "photos" })
    if (!ObjectId.isValid(id)) {

        return null
    } else {
        const results = await bucket.find({ _id: new ObjectId(id) })
            .toArray()
        console.log("== results:", results)
        // const results = await collection.find({ _id: new ObjectId(id) })
        //     .toArray()
        return results[0]
    }
}

exports.getImageInfoByBusinessId = async function (id) {
    const db = getDbReference()
    // const collection = db.collection('images')
    const bucket = new GridFSBucket(db, { bucketName: "photos" })
    if (!ObjectId.isValid(id)) {
   
        return null
    } else {
        //const results = await bucket.find({ _businessId: new ObjectId(id) })
            //.toArray()
        //get the image info from the database using the businessID metadata
        const results = await bucket.find({ businessId: new ObjectId(id) })
            .toArray()
        console.log("== results:", results)
        // const results = await collection.find({ _id: new ObjectId(id) })
        //     .toArray()
        return results[0]
    }
}

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
    const db = getDbReference()
    const collection = db.collection('photos')
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const results = await collection
        .find({ _id: new ObjectId(id) })
        .toArray()
        return results[0]
    }
}
exports.getPhotoById = getPhotoById


exports.getImageDownloadStreamByFilename = function (filename) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: "photos" })
    return bucket.openDownloadStreamByName(filename)
}

exports.getDownloadStreamById = function (id) {

    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'photos' })
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        return bucket.openDownloadStream(new ObjectId(id))
    }
}

exports.addThumbNail= async function (id, tags) {
    const db = getDbReference()
    const collection = db.collection('photos.files')
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { "metadata.tags": tags }}
        )
        return result.matchedCount > 0
    }
}

exports.updateThumb=async function (thumbBuffer, id) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: "photos" })
    const thumbBucket = new GridFSBucket(db, { bucketName: "thumbs" })

    if (!ObjectId.isValid(id)) {
        //add thumb to the bucket
        const uploadStream = thumbBucket.openUploadStream(
            id,
            { metadata: { businessId: id } }
        )
        uploadStream.end(thumbBuffer)
        return uploadStream.id
    } else {
        const result = await bucket.delete(new ObjectId(id))
        const uploadStream = thumbBucket.openUploadStream(
            id,
            { metadata: { businessId: id } }
        )
        uploadStream.end(thumbBuffer)
        return uploadStream.id
    }
}