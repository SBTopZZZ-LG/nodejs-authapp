const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Nodemailer = require("../utils/nodemailer")
const Twilio = require("../utils/twilio.sms")
const jwt = require("jsonwebtoken")
const { v4: uuidv4 } = require("uuid")

const schema = new Schema({
    avatar_url: {
        url: {
            type: String,
            default: null,
            validate: async (url) => {
                if (url && !/^http(s)?:\/\/.+$/.test(url))
                    throw new Error("Avatar url is invalid")

                if ((await fetch(url)).status !== 200)
                    throw new Error("Avatar url resource is inaccessible or not found")

                return true
            },
            maxlength: 2048
        },
        last_refreshed: {
            type: Date,
            required: true,
            validate: (last_refreshed) => {
                if (last_refreshed.getTime() > Date.now())
                    throw new Error("Last refreshed cannot be a future date")

                return true
            }
        }
    },
    email: {
        email: {
            type: String,
            required: true,
            validate: (email) => {
                if (!/^[a-z0-9\._]+@[a-z0-9\._]+$/i.test(email))
                    throw new Error("Email is malformed")

                return true
            },
            maxlength: 128
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    phone: {
        phone: {
            type: String,
            required: true,
            validate: (phone) => {
                if (!/^\+\d+ \d+$/.test(phone))
                    throw new Error("Phone number is malformed")

                return true
            },
            maxlength: 20
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    password: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true,
        validate: (full_name) => {
            if (!/^.+ (.+ )?.+$/i.test(full_name))
                throw new Error("Full name is invalid")

            return true
        },
        maxlength: 256
    },
    two_factor_auth: {
        isEnabled: {
            type: Boolean,
            default: false
        },
        first_question: {
            question: {
                type: String,
                default: null,
                validate: (question) => {
                    if (question.trim().length == 0)
                        throw new Error("First question is invalid")

                    return true
                },
                maxlength: 1024
            },
            answer: {
                type: String,
                default: null,
                validate: (answer) => {
                    if (answer.trim().length == 0)
                        throw new Error("First question answer is invalid")

                    return true
                },
                maxlength: 16
            }
        },
        second_question: {
            question: {
                type: String,
                default: null,
                validate: (question) => {
                    if (question.trim().length == 0)
                        throw new Error("Second question is invalid")

                    return true
                },
                maxlength: 1024
            },
            answer: {
                type: String,
                default: null,
                validate: (answer) => {
                    if (answer.trim().length == 0)
                        throw new Error("Second question answer is invalid")

                    return true
                },
                maxlength: 16
            }
        },
        third_question: {
            question: {
                type: String,
                default: null,
                validate: (question) => {
                    if (question.trim().length == 0)
                        throw new Error("Third question is invalid")

                    return true
                },
                maxlength: 1024
            },
            answer: {
                type: String,
                default: null,
                validate: (answer) => {
                    if (answer.trim().length == 0)
                        throw new Error("Third question answer is invalid")

                    return true
                },
                maxlength: 16
            }
        },
    },
    login_tokens: [{
        login_token: {
            type: String,
            required: true
        },
        device_name: {
            type: String,
            required: true,
            validate: (device_name) => {
                if (device_name.trim().length == 0)
                    throw new Error("Device name is invalid")

                return true
            },
            maxlength: 64
        }
    }]
})

const User = mongoose.model("users", schema)

schema.statics.changeEmail = async (email) => {
    if (typeof email != "string")
        throw new Error("Email is not a valid string")

    if (!/^[a-z0-9\._]+@[a-z0-9\._]+$/i.test(email))
        throw new Error("Email is invalid")

    if (await User.findOne({ "email.email": email }).exec())
        throw new Error("Email is already in use")

    await Nodemailer.sendEmail(email, "Verify your email ✅", "Hello fellow user!\n\nBefore you can continue, you need to verify your email address.\nClick the link below to activate your email:\nURL")
    this["email"]["email"] = email
    this["email"]["isVerified"] = false

    await this.save()
}
schema.statics.changePhone = async (phone) => {
    if (typeof phone != "string")
        throw new Error("Phone is not a valid string")

    if (!/^\+\d+ \d+$/.test(phone))
        throw new Error("Phone is invalid")

    if (await User.findOne({ "phone.phone": phone }).exec())
        throw new Error("Phone number is already in use")

    await Twilio.sendSms(phone, "Hello fellow user!\n\nBefore you can continue, you need to verify your phone number.\nClick the link below to activate your phone number:\nURL")
    this["phone"]["phone"] = phone
    this["phone"]["isVerified"] = false

    await this.save()
}
schema.statics.changePassword = async (password) => {
    if (typeof password != "string")
        throw new Error("Password is not a valid string")

    if (password.length < 6)
        throw new Error("Password is too short")
    else if (password.length > 16)
        throw new Error("Password is too long")

    this["password"] = jwt.sign(password, "thi$_is_t0p_$3cret")

    await this.save()
}
schema.statics.generateLoginToken = async (device_name) => {
    if (typeof device_name != "string")
        throw new Error("Device name is not a valid string")

    if (device_name.trim().length == 0)
        throw new Error("Device name is invalid")

    const login_token = uuidv4()
    if (!this["login_tokens"])
        this["login_tokens"] = []
    this["login_tokens"].push({
        login_token,
        device_name
    })

    await this.save()
}

module.exports = User