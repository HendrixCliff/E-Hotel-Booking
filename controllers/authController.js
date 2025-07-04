const User = require("./../models/userSchema")
const asyncErrorHandler = require("./../utils/asyncErrorHandler")
const dotenv = require("dotenv")
const CustomError = require("./../utils/CustomError")
const { sendForgotPasswordEmail } = require('./../utils/sendForgotPasswordEmail');
dotenv.config({path: "./config.env"})
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { createSendResponse } = require("../config/createSendResponse");




exports.signup = asyncErrorHandler(async (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn("⚠️ Email already in use:", email);
      return next(new CustomError("Email is already in use", 409));
    }

    const newUser = await User.create({
      name,
      email,
      password,
      confirmPassword,
      date: new Date()
    });

    // ✅ Select the role before session login
    const user = await User.findById(newUser._id).select('+role');

    console.log("✅ New user created:", user._id);

    req.login(user, (err) => {
      if (err) {
        console.error("❌ Login error after signup:", err);
        return next(new CustomError("Login after signup failed", 500));
      }

      console.log("✅ User logged in after signup:", user._id);
      createSendResponse(user, 201, req, res);
    });

  } catch (error) {
    console.error("❌ Error during signup:", error.message);
    return next(new CustomError("Signup failed", 500));
  }
});



   
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

  const user = await User.findOne({ email }).select('+password +role');
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });
    console.log("✅ User found:", user);
   console.log("🔑 Entered password:", password);
   console.log("🔒 Stored hash:", user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });
      

    console.log(isMatch, "✅ Password match successful");
    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: "Login failed" });
      createSendResponse(user, 200, req, res);
    });

  } catch (err) {
    next(err);
  }
};

    


exports.restrict = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {       
            return next(new CustomError("You do not have permission to perform this action", 403))
        }
        next()
    }
}

    exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
          return next(new CustomError("There is no user with this email address", 404));
      }
  
     const resetToken = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendBaseUrl = 'http://localhost:5173';
    const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;

      try {
          // Send the password reset email
          await sendForgotPasswordEmail(user.email, resetUrl);
  
          res.status(200).json({
              status: "success",
              message: "Password reset link sent to the user's email",
          });
      } catch (err) {
          // Reset token fields in case of an email failure
          user.passwordResetToken = undefined;
          user.passwordResetTokenExpires = undefined;
          await user.save({ validateBeforeSave: false });
  
          console.log(err);
          return next(
              new CustomError("There was an error sending the email. Try again later", 500)
          );
      }
  });

  exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    // 1. Hash the token from the URL
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // 2. Find the user based on token and expiration
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 3. Handle invalid or expired token
  if (!user) {
    return next(new CustomError("Token is invalid or has expired", 400));
  }

  // 4. Set new password fields
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;

  // 5. Clear reset fields
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();

  // 6. Save updated user
  await user.save();

  // 7. Respond without helper
  res.status(200).json({
    status: "success",
    message: "Password reset successful. You can now log in with your new password.",
    data: {
      id: user._id,
      email: user.email,
      name: user.name
    }
  });
  });

