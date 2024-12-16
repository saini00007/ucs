import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import AppError from '../utils/AppError.js'; // Assuming AppError is in the utils folder

dotenv.config();

// Create a transporter object
const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
});

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.MAIL_USER,
        to,
        subject,
        text,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new AppError('Failed to send email', 500);
    }
};

export default sendEmail;
