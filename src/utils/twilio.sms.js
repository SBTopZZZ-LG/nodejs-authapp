const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTHTOKEN);

module.exports = class {
    static async sendSms(target, body) {
        return client.messages
            .create({
                body: body,
                from: '+19107202753',
                to: target
            })
    }
}