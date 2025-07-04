const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  address: String,
  contactEmail: String,
  phone: String,
  stars: {
    type: Number,
    min: 1,
    max: 5
  },
  image: {
    type: String // Cloudinary or local path
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hotel', hotelSchema);
