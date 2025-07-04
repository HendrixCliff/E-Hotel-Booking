const cron = require('node-cron');
const Booking = require('../models/bookingSchema');
const Room = require('../models/roomSchema');

const releaseRoomsAfterCheckout = async () => {
  const now = new Date();

  const bookings = await Booking.find({
    status: 'Confirmed',
    checkOutDate: { $lte: now }
  });

  for (const booking of bookings) {
    const room = await Room.findById(booking.room);
    if (room && !room.isAvailable) {
      room.isAvailable = true;
      await room.save();
    }

    booking.status = 'Checked-Out';
    await booking.save();

    console.log(`🏁 Room ${room.name} marked available again.`);
  }
};

module.exports = () => {
  cron.schedule('0 1 * * *', releaseRoomsAfterCheckout); // Every day at 1:00 AM
};
