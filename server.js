require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const app = require('./app');
require('./utils/expireBookingsJob')();
require('./utils/notifyExpiringBookings')();
require('./utils/releaseCheckedOutRooms')();


(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  }
})();
