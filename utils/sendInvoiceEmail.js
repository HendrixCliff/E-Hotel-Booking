const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Verify on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
  } else {
    console.log('✅ Email transporter is ready to send messages');
  }
});

/**
 * Send invoice email with optional booking details.
 * @param {string} to
 * @param {string} name
 * @param {string} invoiceUrl
 * @param {string} bookingCode - fallback if no multiple codes
 * @param {Object} details - includes hotelName, checkInDate, checkOutDate, rooms[], bookingCodes[]
 */
module.exports = async function sendInvoiceEmail(to, name, invoiceUrl, bookingCode, details = {}) {
  try {
    console.log(`📨 Attempting to send email to ${to}...`);

    const { hotelName, checkInDate, checkOutDate, rooms, bookingCodes = [] } = details;

    const formattedCheckIn = checkInDate
      ? new Date(checkInDate).toLocaleDateString()
      : '—';

    const formattedCheckOut = checkOutDate
      ? new Date(checkOutDate).toLocaleDateString()
      : '—';

    const roomList = Array.isArray(rooms)
      ? rooms.map(r => `• ${r.name}`).join('<br>')
      : '';

    const codeList = Array.isArray(bookingCodes) && bookingCodes.length > 1
      ? bookingCodes.map(code => `• ${code}`).join('<br>')
      : `• ${bookingCodes[0] || bookingCode}`;

    const htmlContent = `
      <div style="font-family: sans-serif; line-height: 1.5">
        <h2>Hi ${name},</h2>
        <p>Your booking has been confirmed.</p>

        <p><strong>Booking Code(s):</strong><br>${codeList}</p>
        ${hotelName ? `<p><strong>Hotel:</strong> ${hotelName}</p>` : ''}
        ${checkInDate ? `<p><strong>Check-in:</strong> ${formattedCheckIn}</p>` : ''}
        ${checkOutDate ? `<p><strong>Check-out:</strong> ${formattedCheckOut}</p>` : ''}
        ${roomList ? `<p><strong>Room(s):</strong><br>${roomList}</p>` : ''}

        <p>You can download your invoice here:</p>
        <a href="${invoiceUrl}" style="padding: 10px 15px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px;" target="_blank">
          Download Invoice PDF
        </a>

        <p>Thank you for choosing our service!<br>— The E-Hotel Booking Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Hotel Booking" <${process.env.GMAIL_USER}>`,
      to,
      subject: '🧾 Your Booking Invoice',
      html: htmlContent
    });

    console.log(`✅ Email sent successfully to ${to}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}: ${err.message}`);
  }
};
