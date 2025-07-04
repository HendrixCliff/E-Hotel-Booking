const express = require('express');
const cors = require('cors');
const passport = require('passport');
require('./config/passport')(passport);
const session = require('express-session');
const MongoStore = require('connect-mongo');


 const authRoutes = require('./routes/authRoutes');
  const adminRoutes = require('./routes/adminRoutes');
  const roomRoutes = require('./routes/roomRoutes');
  const hotelRoutes = require('./routes/hotelRoutes');
  const bookingRoutes = require('./routes/bookingRoutes');
  const paymentRoutes = require('./routes/paymentRoutes');
 const adminSectionRoutes = require('./routes/adminSectionRoutes');

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = express();

// Mongo session setup (will be used by Passport)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // 🧠 use URI directly here
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Init Passport after session
app.use(passport.initialize());
app.use(passport.session());

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Middleware
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


 //routes

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/rooms', roomRoutes);
  app.use('/api/v1/hotels', hotelRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
 app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/admin/sections', adminSectionRoutes);

module.exports = app;
