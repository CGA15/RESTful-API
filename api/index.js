const { Router } = require('express')

const router = Router()

router.use('/businesses', require('./businesses'))
router.use('/photos', require('./photos'))
const { connectToRabbitMQ, getChannel } = require('../lib/rabbitmq')

module.exports = router
