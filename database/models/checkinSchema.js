const mongoose = require('mongoose')

const checkinschema = mongoose.Schema({
  Reason: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  cID: {
    type: mongoose.SchemaTypes.String,
    default: null,
    required: true
  },
  userId: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  checkedinAt: {
    type: mongoose.SchemaTypes.String,
    default: null
  }
})

module.exports = mongoose.model('checkin', checkinschema)