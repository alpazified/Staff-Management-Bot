const config = require('../config.json');
const mongoose = require('mongoose');

module.exports = {
  init: () => {
    if (!config.mongooseConnectionString)
      throw new Error('\x1b[31m%s\x1b[0m', `❌ | No MongoDB Client Key found in the configuration.`)

    // Init the connection and the Parser. Database connection link is protected in the Config
    mongoose.connect(config.mongooseConnectionString, {
      keepAlive: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    mongoose.Promise = global.Promise

    // If Database errors, log it-
    mongoose.connection.on('err', err => {
      console.log('\x1b[31m%s\x1b[0m', '❌ | MONGO DB ERROR\n\n' + err)
    })

    // If Database disconnects, log it.
    mongoose.connection.on('disconnected', () => {   
      console.log('\x1b[31m%s\x1b[0m', '❌ | DISCONNECTED FROM THE DATABASE')
    })

    // If Database successfully connects, log it.
    mongoose.connection.on('connected', () => {
      console.log('\x1b[32m%s\x1b[0m', '✅ | Successfully CONNECTED TO THE DATABASE')
    })
  }
}