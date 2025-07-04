const Hotel = require('../models/hotelSchema');
const Location = require('../models/locationSchema');


exports.getAllLocations = async (req, res) => {
  const locations = await Location.find().sort({ name: 1 });
  res.json(locations);
};



exports.getHotelsByLocation = async (req, res) => {
  const locationName = req.body.location?.trim();

  try {
    if (!locationName) {
      return res.status(400).json({ error: 'Location is required in body' });
    }

    const location = await Location.findOne({ name: new RegExp(`^${locationName}$`, 'i') });

    if (!location) {
      return res.status(404).json({ error: `Location '${locationName}' not found` });
    }

    const hotels = await Hotel.find({ location: location._id }).populate('location', 'name');
    res.status(200).json(hotels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

