const nodemailer = require('nodemailer');
const EmailServiceError = require('./errors/EmailServiceError');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResetCode = async (email, code) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code',
      text: `Your password reset code is: ${code}`,
      html: `<h1>Password Reset Code</h1><p>Your password reset code is: <strong>${code}</strong></p>`
    };

    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    
    if (!info.messageId) {
      throw new EmailServiceError('Failed to send email', 500);
    }

    return true;
  } catch (error) {
    if (error.name === 'EmailServiceError') {
      throw error;
    }
    throw new EmailServiceError(
      error.code === 'EAUTH' ? 'Email authentication failed' :
      error.code === 'ESOCKET' ? 'Network error while sending email' :
      'Failed to send email',
      500
    );
  }
};

const sendContactEmail = async (name, email, message) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL,
      subject: `New Contact Message from ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

module.exports = { sendResetCode, sendContactEmail };
