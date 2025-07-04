const Booking = require('../models/bookingSchema');
const Room = require('../models/roomSchema');
const User = require('../models/userSchema');
const generateInvoiceBuffer = require('../utils/generateInvoicePdf');
const sendInvoiceEmail = require('../utils/sendInvoiceEmail');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');


exports.createBookingManually = async (req, res) => {
  try {
    const { roomIds, checkInDate, checkOutDate } = req.body;

    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized. No user email found.' });
    }

    if (!roomIds?.length || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'roomIds, checkInDate, and checkOutDate are required' });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (isNaN(checkIn) || isNaN(checkOut)) {
      return res.status(400).json({ error: 'Invalid check-in or check-out date' });
    }

    const rooms = await Room.find({ _id: { $in: roomIds }, isAvailable: true }).populate('hotel');
    if (!rooms.length) {
      return res.status(400).json({ error: 'No available rooms found for the given IDs' });
    }

    const tx_ref = `manual-${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(checkOutDate);
    expiresAt.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

    const bookings = [];

    for (const room of rooms) {
      const bookingCode = `${tx_ref}-${room._id.toString().slice(-5)}`;

      const booking = await Booking.create({
        user: user._id,
        hotel: room.hotel._id,
        room: room._id,
        bookingCode,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        expiresAt,
        status: 'Confirmed'
      });

      room.isAvailable = false;
      await room.save();

      bookings.push({ booking, room, hotel: room.hotel, bookingCode });
    }

    // 🧾 Invoice logic
    try {
      const bookingCodes = bookings.map(b => b.bookingCode);
      const invoiceRooms = bookings.map(b => b.room);
      const hotel = bookings[0].hotel;
      let invoiceUrl = null;

      if (bookings.length === 1) {
        const { bookingCode, room } = bookings[0];

        const buffer = await generateInvoiceBuffer({
          user,
          hotel,
          bookingCode,
          rooms: [room],
          checkInDate,
          checkOutDate
        });

        const upload = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'invoices',
              resource_type: 'raw',
              public_id: bookingCode
            },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });

        invoiceUrl = upload.secure_url;

        bookings[0].booking.invoiceUrl = invoiceUrl;
        await bookings[0].booking.save();

        await sendInvoiceEmail(
          user.email,
          user.name,
          invoiceUrl,
          bookingCode,
          {
            hotelName: hotel.name,
            checkInDate,
            checkOutDate,
            rooms: [room],
            bookingCode
          }
        );

      } else {
        const mergedCode = `${tx_ref}-group`;

        const buffer = await generateInvoiceBuffer({
          user,
          hotel,
          bookingCode: mergedCode,
          rooms: invoiceRooms,
          checkInDate,
          checkOutDate
        });

        const upload = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'invoices',
              resource_type: 'raw',
              public_id: mergedCode
            },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });

        invoiceUrl = upload.secure_url;

        for (const b of bookings) {
          b.booking.invoiceUrl = invoiceUrl;
          await b.booking.save();
        }

        await sendInvoiceEmail(
          user.email,
          user.name,
          invoiceUrl,
          mergedCode,
          {
            hotelName: hotel.name,
            checkInDate,
            checkOutDate,
            rooms: invoiceRooms,
            bookingCodes
          }
        );
      }

      return res.status(201).json({
        message: `${bookings.length} room(s) booked and invoice sent.`,
        bookingCodes,
        invoiceUrl,
        bookings: bookings.map(b => b.booking)
      });

    } catch (invoiceErr) {
      console.error('⚠️ Invoice or email failed:', invoiceErr);
      return res.status(500).json({ error: 'Booking created but invoice/email failed.' });
    }

  } catch (err) {
    console.error('❌ Error creating manual booking:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.validateBookingCode = async (req, res) => {
  const { code } = req.body;

  try {
    const booking = await Booking.findOne({ bookingCode: code }).populate('user room hotel');

    if (!booking) {
      return res.status(404).json({ error: 'Invalid booking code' });
    }

    if (booking.status === 'Checked-In') {
      return res.status(400).json({ error: 'Guest already checked in' });
    }

    booking.status = 'Checked-In';
    await booking.save();

    res.json({
      message: 'Booking validated and guest checked in',
      booking
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.invoiceDownloader = async (req, res) => {
  const booking = await Booking.findOne({ bookingCode: req.params.bookingCode });

  if (!booking || booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Unauthorized or not found' });
  }

  if (!booking.invoiceUrl) {
    return res.status(404).json({ message: 'Invoice not yet generated' });
  }

  res.redirect(booking.invoiceUrl);
};
