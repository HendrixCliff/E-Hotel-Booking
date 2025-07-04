const Location = require('../models/locationSchema');
const Hotel = require('../models/hotelSchema');
const Room = require('../models/roomSchema');
const Booking = require('../models/bookingSchema');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
// LOCATION
exports.createLocation = async (req, res) => {
  try {
    const location = await Location.create({ name: req.body.name });
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.createHotel = async (req, res) => {
  try {
    const locationName = req.body.location?.trim();

    const location = await Location.findOne({ name: new RegExp(`^${locationName}$`, 'i') });

    if (!location) {
      return res.status(404).json({ error: `Location '${locationName}' not found` });
    }

    // 📸 Priority: uploaded file > URL in body
    let imagePath = req.file?.path || null;

    // 💻 In dev, allow Cloudinary URL from req.body.image
    if (!imagePath && process.env.NODE_ENV === 'development' && req.body.image) {
      imagePath = req.body.image;
    }

    // 🚫 In production, image is required
    if (!imagePath && process.env.NODE_ENV !== 'development') {
      return res.status(400).json({ error: 'Image upload is required' });
    }

    const hotel = await Hotel.create({
      name: req.body.name,
      address: req.body.address,
      contactEmail: req.body.contactEmail,
      phone: req.body.phone,
      stars: req.body.stars,
      image: imagePath,
      location: location._id
    });

    res.status(201).json(hotel);

  } catch (err) {
    console.error('Error creating hotel:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const hotelId = req.params.id;

    // 🔍 Find existing hotel
    const existingHotel = await Hotel.findById(hotelId);
    if (!existingHotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    // 🔁 Optional: update location by name
    let locationId = existingHotel.location;
    if (req.body.location) {
      const locationDoc = await Location.findOne({
        name: new RegExp(`^${req.body.location.trim()}$`, 'i')
      });
      if (!locationDoc) {
        return res.status(404).json({ error: `Location '${req.body.location}' not found` });
      }
      locationId = locationDoc._id;
    }

    // 📸 Handle image update
    let imagePath = req.file?.path || existingHotel.image;
    if (!req.file?.path && process.env.NODE_ENV === 'development' && req.body.image) {
      imagePath = req.body.image;
    }

    // 🚫 Require image in production if it's not already set
    if (!imagePath && process.env.NODE_ENV !== 'development') {
      return res.status(400).json({ error: 'Hotel image is required in production' });
    }

    // ✅ Build updated fields
    const updateData = {
      name: req.body.name || existingHotel.name,
      address: req.body.address || existingHotel.address,
      contactEmail: req.body.contactEmail || existingHotel.contactEmail,
      phone: req.body.phone || existingHotel.phone,
      stars: req.body.stars ?? existingHotel.stars,
      image: imagePath,
      location: locationId
    };

    const updatedHotel = await Hotel.findByIdAndUpdate(hotelId, updateData, { new: true });

    res.status(200).json(updatedHotel);
  } catch (err) {
    console.error('Error updating hotel:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hotel deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ROOM
// controllers/roomController.js



exports.createRoom = async (req, res) => {
  try {
    const hotelName = req.body.hotel?.trim();
    const image = req.file?.path;

    // 🔍 Look up hotel by name
    const hotel = await Hotel.findOne({ name: new RegExp(`^${hotelName}$`, 'i') });

    if (!hotel) {
      return res.status(404).json({ error: `Hotel '${hotelName}' not found` });
    }

    const room = await Room.create({
      name: req.body.name,
      price: req.body.price,
      capacity: req.body.capacity,
      image,
      hotel: hotel._id
    });

    res.status(201).json(room);

  } catch (err) {
    console.error('Error creating room:', err);
    res.status(400).json({ error: err.message });
  }
};



exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// BOOKINGS (LIST & FILTER)
exports.getAllBookings = async (req, res) => {
  const bookings = await Booking.find().populate('user room hotel');
  res.json(bookings);
};

exports.getBookingsByStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required in request body.' });
    }

    const bookings = await Booking.find({ status }).populate('user room hotel');

    res.status(200).json(bookings);
  } catch (err) {
    console.error('❌ Error fetching bookings by status:', err.message);
    res.status(500).json({ error: 'Server error while retrieving bookings.' });
  }
};

