const Room = require('../models/roomSchema');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const generateInvoiceBuffer = require('../utils/generateInvoicePdf');
const Booking = require('../models/bookingSchema');
const User = require('../models/userSchema');
const sendInvoiceEmail = require('../utils/sendInvoiceEmail');


exports.initiateBankTransfer = async (req, res) => {
  const { roomIds, checkInDate, checkOutDate } = req.body;
  const user = req.user;

  // ✅ Only initialize SDK here when needed
  const Flutterwave = require('flutterwave-node-v3');
  const flw = new Flutterwave(
    process.env.FLW_PUBLIC_KEY,
    process.env.FLW_SECRET_KEY
  );

  if (!Array.isArray(roomIds) || roomIds.length === 0 || roomIds.length > 7) {
    return res
      .status(400)
      .json({ error: 'You can book between 1 and 7 rooms.' });
  }

  const rooms = await Room.find({
    _id: { $in: roomIds },
    isAvailable: true
  }).populate('hotel');

  if (rooms.length !== roomIds.length) {
    return res
      .status(400)
      .json({ error: 'One or more rooms are not available' });
  }

  const tx_ref = `HTL-${Date.now()}-${user._id.toString().slice(-4)}`;
  const totalAmount = rooms.reduce((sum, room) => sum + room.price, 0);

  const payload = {
    tx_ref,
    amount: totalAmount,
    currency: 'NGN',
    payment_options: 'banktransfer',
    redirect_url: 'https://your-frontend.com/payment-complete',
    customer: {
      email: user.email,
      name: user.name
    },
    customizations: {
      title: 'Room Booking',
      description: `Booking ${rooms.length} rooms`
    },
    meta: {
      rooms: roomIds,
      checkInDate,
      checkOutDate
    }
  };

  try {
    const response = await flw.PaymentInitiation.initialize(payload);

    res.json({
      tx_ref,
      totalAmount,
      paymentLink: response.data.link,
      authorization: response.data.meta.authorization
    });
  } catch (err) {
    console.error('❌ Payment init error:', err.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
};

exports.flutterwaveWebhook = async (req, res) => {
  const hash = req.headers['verif-hash'];
  if (!hash || hash !== process.env.FLW_HASH) return res.sendStatus(401);

  const event = req.body;

  if (
    event.event === 'charge.completed' &&
    event.data.status === 'successful'
  ) {
    const tx_ref = event.data.tx_ref;

    const alreadyBooked = await Booking.findOne({ bookingCode: new RegExp(`^${tx_ref}`) });
    if (alreadyBooked) return res.sendStatus(200);

    const userEmail = event.data.customer.email;
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.sendStatus(404);

    const meta = event.data.meta || {};
    const roomIds = meta.rooms || [];
    const checkInDate = new Date(meta.checkInDate);
    const checkOutDate = new Date(meta.checkOutDate);

    if (!checkInDate || !checkOutDate || isNaN(checkInDate) || isNaN(checkOutDate)) {
      return res.status(400).json({ error: 'Invalid check-in/check-out dates' });
    }

    const rooms = await Room.find({ _id: { $in: roomIds } }).populate('hotel');
    if (!rooms.length) return res.sendStatus(400);

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
        checkInDate,
        checkOutDate,
        expiresAt,
        status: 'Confirmed'
      });

      room.isAvailable = false;
      await room.save();

      bookings.push({ booking, room, hotel: room.hotel, bookingCode });
    }

    // 🧾 Generate invoice
    const bookingCodes = bookings.map(b => b.bookingCode);
    const invoiceRooms = bookings.map(b => b.room);
    const hotel = bookings[0].hotel;
    let invoiceUrl = null;

    try {
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
            bookingCodes
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

      console.log(`✅ ${rooms.length} room(s) booked and invoice sent. tx_ref: ${tx_ref}`);

      return res.status(200).json({
        message: 'Booking successful',
        tx_ref,
        bookingCodes,
        invoiceUrl
      });
    } catch (emailErr) {
      console.error('⚠️ Failed sending invoice or email:', emailErr);
      return res.status(500).json({ error: 'Booking saved but email failed.' });
    }
  }

  res.sendStatus(400);
};


