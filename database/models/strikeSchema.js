const mongoose = require('mongoose')

const warnSchema = mongoose.Schema({
  userId: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  modId: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  reason: {
      type: mongoose.SchemaTypes.String,
      default: null
  },
  timestamp: {
      type: mongoose.SchemaTypes.String,
      default: null
  },
  warnId: {
      type: mongoose.SchemaTypes.String,
      default: null,
      unique: true
  }
})

module.exports = mongoose.model('warn', warnSchema)