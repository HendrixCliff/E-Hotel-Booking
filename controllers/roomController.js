const Room = require('../models/roomSchema');
const Hotel = require('../models/hotelSchema');


exports.getRoomsByHotel = async (req, res) => {
  const hotelName = req.body.hotel?.trim();

  try {
    if (!hotelName) {
      return res.status(400).json({ error: 'Hotel name is required in request body.' });
    }

    // 🔍 Match hotel by name (case-insensitive)
    const hotel = await Hotel.findOne({ name: new RegExp(`^${hotelName}$`, 'i') });

    if (!hotel) {
      return res.status(404).json({ error: `Hotel '${hotelName}' not found.` });
    }

    // 🛏️ Find all rooms for that hotel
    const rooms = await Room.find({ hotel: hotel._id });

    res.status(200).json(rooms);

  } catch (err) {
    console.error('Error fetching rooms by hotel name:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.getAvailableRooms = async (req, res) => {
  const hotelName = req.body.hotel?.trim();

  try {
    if (!hotelName) {
      return res.status(400).json({ error: 'Hotel name is required in request body.' });
    }

    // 🔍 Case-insensitive search by hotel name
    const hotel = await Hotel.findOne({ name: new RegExp(`^${hotelName}$`, 'i') });

    if (!hotel) {
      return res.status(404).json({ error: `Hotel '${hotelName}' not found.` });
    }

    // ✅ Find rooms that are available in this hotel
    const availableRooms = await Room.find({
      hotel: hotel._id,
      isAvailable: true
    });

    res.status(200).json(availableRooms);

  } catch (err) {
    console.error('Error fetching available rooms:', err);
    res.status(500).json({ error: err.message });
  }
};

