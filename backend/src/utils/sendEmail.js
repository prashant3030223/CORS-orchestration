const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create a transporter
    // For development, we'll use a placeholder/Ethereal or Gmail logic.
    // User needs to provide actual credentials in .env later.
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // 2) Define the email options
    const mailOptions = {
        from: `CORSGuard Enterprise <${process.env.EMAIL_FROM || 'no-reply@corsguard.io'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    // 3) Actually send the email
    const info = await transporter.sendMail(mailOptions);

    // Development Logging: Show the email in console
    if (process.env.EMAIL_SERVICE === 'ethereal' || process.env.NODE_ENV === 'development') {
        console.log('-----------------------------------------');
        console.log('📬 DEV EMAIL DISPATCHED');
        console.log(`TO: ${options.email}`);
        console.log(`SUBJECT: ${options.subject}`);
        console.log('MESSAGE:', options.message);
        if (process.env.EMAIL_SERVICE === 'ethereal') {
            console.log('PREVIEW URL:', nodemailer.getTestMessageUrl(info));
        }
        console.log('-----------------------------------------');
    }
};

module.exports = sendEmail;
