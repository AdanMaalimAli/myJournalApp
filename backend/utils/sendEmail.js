const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // 'gmail'
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `${process.env.EMAIL_USER}`, // sender address
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.html // Optional: if you want to send HTML emails
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
