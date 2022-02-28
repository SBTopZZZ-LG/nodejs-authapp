const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Verification = require("../models/verify")
const Storage = require("../utils/firebase.storage")
const { v4: uuidv4 } = require("uuid")
const bcrypt = require("bcryptjs")

const schema = new Schema({
    avatar_url: {
        url: {
            type: String,
            default: null,
            validate: async (url) => {
                if (!url) return true

                if (!/^http(s)?:\/\/.+$/.test(url))
                    throw new Error("Avatar url is invalid")

                return true
            },
            maxlength: 2048
        },
        last_refreshed: {
            type: Date,
            default: null,
            validate: (last_refreshed) => {
                if (!last_refreshed) return true

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
                    if (!question) return true

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
                    if (!answer) return true

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
                    if (!question) return true

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
                    if (!answer) return true

                    if (answer && answer.trim().length == 0)
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
                    if (!question) return true

                    if (question && question.trim().length == 0)
                        throw new Error("Third question is invalid")

                    return true
                },
                maxlength: 1024
            },
            answer: {
                type: String,
                default: null,
                validate: (answer) => {
                    if (!answer) return true

                    if (answer && answer.trim().length == 0)
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
            default: () => uuidv4()
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

schema.statics.createUser = async function (full_name, email, phone, password) {
    if (typeof full_name != "string")
        throw new Error("Full name is not a valid string")

    const user = new this({
        full_name,
        email: {
            email: email,
        },
        phone: {
            "phone": phone,
        },
        password
    })
    await user.save()

    return user
}
schema.statics.signIn = async function (email, phone, password) {
    if (!email && !phone)
        throw new Error("Email or Phone number required")
    else if (email && typeof email != "string")
        throw new Error("Email is not a valid string")
    else if (phone && typeof phone != "string")
        throw new Error("Phone number is not a valid string")
    else if (typeof password != "string")
        throw new Error("Password is not a valid string")

    const user = email ? await this.findOne({ "email.email": email }).exec() : await this.findOne({ "phone.phone": phone }).exec()
    if (!user)
        throw new Error("User account does not exist")

    if (!(await bcrypt.compare(password, user["password"])))
        throw new Error("Password mismatch")

    if (!user["email"]["isVerified"] && !user["phone"]["isVerified"])
        throw new Error("Email and/or Phone number verification required")

    return user
}

schema.methods.update = async function () {
    if (this["avatar_url"]["url"] && Date.now() >= this["avatar_url"]["last_refreshed"] + 24 * 60 * 60 * 1000) {
        this["avatar_url"]["url"] = await Storage.generateUrl(`${this["_id"]}.png`)
        this["avatar_url"]["last_refreshed"] = Date.now()
    }
}
schema.methods.changeEmail = async function (email, { autosave }) {
    if (typeof email != "string")
        throw new Error("Email is not a valid string")

    if (!/^[a-z0-9\._]+@[a-z0-9\._]+$/i.test(email))
        throw new Error("Email is invalid")

    if (await this.constructor.findOne({ "email.email": email }).exec())
        throw new Error("Email is already in use")

    this["email"]["email"] = email
    this["email"]["isVerified"] = false

    await Verification.createEmailVerification(email)

    if (autosave === true)
        await this.save()
}
schema.methods.changePhone = async function (phone, { autosave }) {
    if (typeof phone != "string")
        throw new Error("Phone is not a valid string")

    if (!/^\+\d+ \d+$/.test(phone))
        throw new Error("Phone is invalid")

    if (await this.constructor.findOne({ "phone.phone": phone }).exec())
        throw new Error("Phone number is already in use")

    this["phone"]["phone"] = phone
    this["phone"]["isVerified"] = false

    await Verification.createPhoneVerification(phone)

    if (autosave === true)
        await this.save()
}
schema.methods.changePassword = async function (password, { autosave }) {
    if (typeof password != "string")
        throw new Error("Password is not a valid string")

    if (password.length < 6)
        throw new Error("Password is too short")
    else if (password.length > 16)
        throw new Error("Password is too long")

    this["password"] = await bcrypt.hash(password, 8)

    if (autosave === true)
        await this.save()
}
schema.methods.generateLoginToken = async function (device_name, { autosave }) {
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

    if (autosave === true)
        await this.save()

    return login_token
}

schema.methods.completeVerification = async function (verification) {
    if (typeof verification != 'object')
        throw new Error("Verification is not a valid object")

    if (verification["type"] === "email") {
        if (verification["value"] !== this["email"]["email"])
            throw new Error("Verification email does not match that of current user")
        if (this["email"]["isVerified"])
            throw new Error("Email address already verified")
    } else if (verification["type"] === "phone") {
        if (verification["value"] !== this["phone"]["phone"])
            throw new Error("Verification phone number does not match that of current user")
        if (this["phone"]["isVerified"])
            throw new Error("Phone number address already verified")
    } else if (verification["type"] === "password") {
        if (verification["target"] !== this["email"]["email"])
            throw new Error("Verification does not target")
    }

    if (verification["expires_at"] < Date.now()) {
        // Delete
        await Verification.deleteOne({ _id: verification["_id"] }).exec()
        throw new Error("Verification expired")
    }

    if (verification["type"] === "email")
        this["email"]["isVerified"] = true
    else if (verification["type"] === "phone")
        this["phone"]["isVerified"] = true
    else if (verification["type"] === "password")
        this["password"] = verification["value"]

    await this.save()
    await Verification.deleteOne({ _id: verification["_id"] }).exec()
}

schema.pre('save', async function (next) {
    const user = this

    if (user.isModified("email.email")) {
        await user.changeEmail(user["email"]["email"], { autosave: false })
        user["login_tokens"] = []
    }
    if (user.isModified("phone.phone")) {
        await user.changePhone(user["phone"]["phone"], { autosave: false })
        user["login_tokens"] = []
    }
    if (user.isModified("password")) {
        await user.changePassword(user["password"], { autosave: false })
        user["login_tokens"] = []
    }

    return next()
})

module.exports = mongoose.model("user", schema)