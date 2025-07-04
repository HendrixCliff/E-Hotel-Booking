const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); // Load environment variables  

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

module.exports = async (to, subject, htmlOrText) => {
  await transporter.sendMail({
    from: `"Hotel Booking" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html: `<p>${htmlOrText}</p>`
  });
};
