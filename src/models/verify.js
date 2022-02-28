const mongoose = require("mongoose")
const Schema = mongoose.Schema

const { v4: uuidv4 } = require("uuid")
const Nodemailer = require("../utils/nodemailer")
const Twilio = require("../utils/twilio.sms")

const schema = new Schema({
    type: {
        type: String,
        enum: ["email", "phone", "password"],
        default: "email"
    },
    value: {
        type: String,
        required: true
    },
    target: {
        type: String,
    },
    verification_token: {
        type: String,
        default: () => uuidv4()
    },
    expires_at: {
        type: Date,
        required: true
    }
})

schema.statics.createEmailVerification = async function (email) {
    if (typeof email != "string")
        throw new Error("Email is not a valid string")

    // Remove previous verifications
    await this.deleteMany({ type: "email", value: email }).exec()

    const verification = new this({
        type: "email",
        value: email,
        expires_at: Date.now() + 24 * 60 * 60 * 1000
    })
    await verification.save()

    // TODO: Uncomment
    await Nodemailer.sendEmail(email, "Verify your email ✅", `Hello fellow user!\n\nBefore you can continue, you need to verify your email address.\nClick the link below to activate your email:\nhttp://localhost:3000/user/verify?token=${verification["verification_token"]}`)

    return verification
}
schema.statics.createPhoneVerification = async function (phone) {
    if (typeof phone != "string")
        throw new Error("Phone number is not a valid string")

    // Remove previous verifications
    await this.deleteMany({ type: "phone", value: phone }).exec()

    const verification = new this({
        type: "phone",
        value: phone,
        expires_at: Date.now() + 24 * 60 * 60 * 1000
    })
    await verification.save()

    // TODO: Uncomment
    // await Twilio.sendSms(phone, "Hello fellow user!\n\nBefore you can continue, you need to verify your phone number.\nClick the link below to activate your phone number:\nURL")

    return verification
}
schema.statics.createResetPasswordVerification = async function (target, new_password) {
    if (typeof target != "string" || typeof new_password != "string")
        throw new Error("Password is not a valid string")

    if (!/^[a-z0-9\._]+@[a-z0-9\._]+$/i.test(target))
        throw new Error("Email is invalid")

    if (new_password.length < 6)
        throw new Error("Password is too short")
    else if (new_password.length > 16)
        throw new Error("Password is too long")

    // Remove previous verifications
    await this.deleteMany({ type: "password", target }).exec()

    const verification = new this({
        type: "password",
        target,
        value: new_password,
        expires_at: Date.now() + 24 * 60 * 60 * 1000
    })
    await verification.save()

    await Nodemailer.sendEmail(target, "Password reset", `Hello!\n\nLooks like someone, or you, have requested to reset your account's password.\nClick on the link below to confirm password reset.\nhttp://localhost:3000/user/verify?token=${verification["verification_token"]}`)

    return verification
}
schema.statics.completeVerification = async function (verification_token) {
    if (typeof verification_token != "string")
        throw new Error("Verification token is not a valid string")

    return this.findOne({ verification_token }).exec()
}

module.exports = mongoose.model("verification", schema)