const cron = require('node-cron');
const Booking = require('../models/bookingSchema');
const sendEmail = require('./sendReminderEmail');

const notifyExpiringSoon = async () => {
  const threshold = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now

  const bookings = await Booking.find({
    status: 'Pending',
    expiresAt: { $lte: threshold, $gt: new Date() }
  }).populate('user');

  for (const booking of bookings) {
    await sendEmail(
      booking.user.email,
      `⚠️ Your Room Booking is Expiring Soon`,
      `Dear ${booking.user.name}, your reservation (${booking.bookingCode}) will expire in less than 10 minutes if payment is not completed.`
    );
    console.log(`🔔 Reminder sent to ${booking.user.email}`);
  }
};

module.exports = () => {
  cron.schedule('*/5 * * * *', notifyExpiringSoon); // every 5 mins
};
