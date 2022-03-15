const mongoose = require('mongoose')

const loareq = mongoose.Schema({
  Reason: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  Duration: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  LOAId: {
    type: mongoose.SchemaTypes.String,
    default: null,
    required: true
  },
  userId: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  startedAt: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  endedAt: {
    type: mongoose.SchemaTypes.String,
    default: null
  }
})

module.exports = mongoose.model('loa', loareq)