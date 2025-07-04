const cron = require('node-cron');
const Booking = require('../models/bookingSchema');
const Room = require('../models/roomSchema');

const expireUnpaidBookings = async () => {
  const now = new Date();

  const expiredBookings = await Booking.find({
    status: 'Pending',
    expiresAt: { $lte: now }
  });

  for (const booking of expiredBookings) {
    booking.status = 'Cancelled';
    await booking.save();

    const room = await Room.findById(booking.room);
    if (room) {
      room.isAvailable = true;
      await room.save();
    }

    console.log(`❌ Booking expired & room released: ${booking.bookingCode}`);
  }
};

module.exports = () => {
  cron.schedule('*/5 * * * *', expireUnpaidBookings); // every 5 mins
};
