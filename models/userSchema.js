const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  date: {
    type: Date,
    required: true,
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "admin",
    select: true // ← include in queries by default,
  },
 password: {
  type: String,
  required: true,
  select: false // ← requires manual selection
},
 confirmPassword: {
  type: String,
  minlength: 5,
  validate: {
    validator: function(val) {
      return val === this.password;
    },
    message: "Password and confirmPassword do not match"
  }
},
  active: {
    type: Boolean,
    select: false,
    default: true
  },
  passwordResetToken: String,
  passwordResetExpires: Date
});

// 🔐 Hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined; // 🧼 Clean up confirmPassword
  next();
});


// 👁️ Filter out inactive users on find queries
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// 🔁 Password comparison method
userSchema.methods.comparePasswordInDb = async function(pswd, pswdDb) {
  return await bcrypt.compare(pswd, pswdDb);
};

// 🔑 Create password reset token method
userSchema.methods.createResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex'); // Plain token
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Hashed
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Valid for 10 minutes
  return resetToken; // Send plain token to user
};

const User = mongoose.model('User', userSchema);
module.exports = User;
