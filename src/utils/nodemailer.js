const nodemailer = require("nodemailer")
const config = require("../configs/nodemailer.json")

const transporter = nodemailer.createTransport({
    host: config.GMAIL.SMTP,
    port: config.GMAIL.SMTP_PORT,
    auth: {
        user: config.GMAIL.EMAIL,
        pass: config.GMAIL.APP_PASSWORD
    }
})

module.exports = class {
    static async sendEmail(target, subject, body) {
        try {
            return transporter.sendMail({ sender: config.GMAIL.EMAIL, subject: subject, to: target, text: body })
        } catch (e) {
            console.error("Nodemailer error!", e)
            return null
        }
    }
}