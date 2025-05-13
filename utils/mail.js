const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE,
    secure: true,
    name: 'Chat',
    auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASS,
    },
})

exports.sendEmailVerificationLink = (email, generatedString) => {
    const mailOptions = {
        sender: `"Chat" <${process.env.APP_USER}>`,
        receiver: email,
        subject: 'Verification',
        text: 'Please verify your account, ' + process.env.FRONTEND_URL + 'verification/' + generatedString
    }
    transport.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log('Email Sent ', info.response)
        }
    })
}