const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  bookingCode: {
    type: String,
    unique: true,
    required: true
  },
  expiresAt: {
  type: Date,
  required: true
},
invoiceUrl: {
  type: String
},
  checkInDate: Date,
  checkOutDate: Date,
 status: {
  type: String,
  enum: ['Pending', 'Confirmed', 'Checked-In', 'Cancelled'], 
  default: 'Pending'
}

}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
