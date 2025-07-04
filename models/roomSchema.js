const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  image: {
    type: String
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true  // ✅ available by default
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);
