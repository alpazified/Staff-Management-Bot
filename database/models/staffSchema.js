const mongoose = require('mongoose')

const StaffUser = mongoose.Schema({
  userId: {
    type: mongoose.SchemaTypes.String,
    default: null
  },

  Position: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  Email: {
    type: mongoose.SchemaTypes.String,
    default: null
  },
  Timezone: {
    type: mongoose.SchemaTypes.String,
    default: null
  }
})

module.exports = mongoose.model('staff', StaffUser)