const nodemailer = require('nodemailer');
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const senderEmail = process.env.GMAIL_USER;
const appPassword = process.env.GMAIL_PASS;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: senderEmail,
    pass: appPassword
  }
});

const sendForgotPasswordEmail = async (recipientEmail, resetUrl) => {
  const mailOptions = {
    from: `"MyApp Support" <${senderEmail}>`,
    to: recipientEmail,
    subject: '🔐 Reset Your Password',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>Password Reset Request</h2>
        <p>You recently requested to reset your password. Click below to reset it:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn’t request this, ignore this email.</p>
        <p>This link expires in 10 minutes.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.response);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error("Email could not be sent");
  }
};

module.exports = { sendForgotPasswordEmail };
