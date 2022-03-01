const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Verification = require("../models/verify")
const Storage = require("../utils/firebase.storage")
const { v4: uuidv4 } = require("uuid")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const UserRecord = require("../utils/user.verify.record")

const schema = new Schema({
    avatar_url: {
        url: {
            type: String,
            default: null,
            validate: async (url) => {
                if (!url) return true

                if (!/^http(s)?:\/\/.+$/.test(url))
                    throw new Error("invalidAvatarUrl")

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
                    throw new Error("invalidLastRefreshedDate")

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
                    throw new Error("malformedEmail")

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
                    throw new Error("malformedPhoneNumber")

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
                throw new Error("invalidFullName")

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
                        throw new Error("invalidFirstQuestion")

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
                        throw new Error("invalidFirstQuestionAnswer")

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
                        throw new Error("invalidSecondQuestion")

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
                        throw new Error("invalidSecondQuestionAnswer")

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
                        throw new Error("invalidThirdQuestion")

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
                        throw new Error("invalidThirdQuestionAnswer")

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
                    throw new Error("invalidDeviceName")

                return true
            },
            maxlength: 64
        }
    }]
})

schema.statics.createUser = async function (full_name, email, phone, password) {
    if (typeof full_name != "string")
        throw new Error("fullNameNotAValidString")

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
        throw new Error("emailOrPhoneRequired")
    else if (email && typeof email != "string")
        throw new Error("emailNotAValidString")
    else if (phone && typeof phone != "string")
        throw new Error("phoneNotAValidString")
    else if (typeof password != "string")
        throw new Error("passwordNotAValidString")

    const user = email ? await this.findOne({ "email.email": email }).exec() : await this.findOne({ "phone.phone": phone }).exec()
    if (!user)
        throw new Error("userNotFound")

    if (!(await bcrypt.compare(password, user["password"])))
        throw new Error("passwordMismatch")

    if (!user["email"]["isVerified"] && !user["phone"]["isVerified"])
        throw new Error("emailAndOrPhoneVerificationRequired")

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
        throw new Error("emailNotAValidString")

    if (!/^[a-z0-9\._]+@[a-z0-9\._]+$/i.test(email))
        throw new Error("malformedEmail")

    if (await this.constructor.findOne({ "email.email": email }).where("_id").ne(this["_id"]).exec())
        throw new Error("emailAlreadyInUse")

    if (!UserRecord.add(`email+${this["_id"].toString()}`))
        throw new Error("timeout")

    this["email"]["email"] = email
    this["email"]["isVerified"] = false

    await Verification.createEmailVerification(email)

    if (autosave === true)
        await this.save()
}
schema.methods.changePhone = async function (phone, { autosave }) {
    if (typeof phone != "string")
        throw new Error("phoneNotAValidString")

    if (!/^\+\d+ \d+$/.test(phone))
        throw new Error("malformedPhoneNumber")

    if (await this.constructor.findOne({ "phone.phone": phone }).where("_id").ne(this["_id"]).exec())
        throw new Error("phoneNumberAlreadyInUse")

    if (!UserRecord.add(`phone+${this["_id"].toString()}`))
        throw new Error("timeout")

    this["phone"]["phone"] = phone
    this["phone"]["isVerified"] = false

    await Verification.createPhoneVerification(phone)

    if (autosave === true)
        await this.save()
}
schema.methods.changePassword = async function (password, { autosave }) {
    if (typeof password != "string")
        throw new Error("passwordNotAValidString")

    if (password.length < 6)
        throw new Error("passwordTooShort")
    else if (password.length > 16)
        throw new Error("passwordTooLong")

    this["password"] = await bcrypt.hash(password, 8)

    if (autosave === true)
        await this.save()
}
schema.methods.generateLoginToken = async function (device_name, { autosave }) {
    if (typeof device_name != "string")
        throw new Error("deviceNameNotAValidString")

    if (device_name.trim().length == 0)
        throw new Error("malformedDeviceName")

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
        throw new Error("verificationNotAValidObject")

    if (verification["type"] === "email") {
        if (verification["value"] !== this["email"]["email"])
            throw new Error("verificationEmailMismatch")
        if (this["email"]["isVerified"])
            throw new Error("emailAlreadyVerified")
    } else if (verification["type"] === "phone") {
        if (verification["value"] !== this["phone"]["phone"])
            throw new Error("verificationPhoneMismatch")
        if (this["phone"]["isVerified"])
            throw new Error("phoneAlreadyVerified")
    } else if (verification["type"] === "password") {
        if (verification["target"] !== this["email"]["email"])
            throw new Error("verificationTargetMismatch")
    }

    if (verification["expires_at"] < Date.now()) {
        // Delete
        await Verification.deleteOne({ _id: verification["_id"] }).exec()
        throw new Error("verificationExpired")
    }

    if (verification["type"] === "email")
        this["email"]["isVerified"] = true
    else if (verification["type"] === "phone")
        this["phone"]["isVerified"] = true
    else if (verification["type"] === "password")
        this["password"] = jwt.decode(verification["value"]).toString()

    await this.save()
    await Verification.deleteOne({ _id: verification["_id"] }).exec()
}

schema.pre('save', async function (next) {
    const user = this

    if (user.isModified("email.email")) {
        await user.changeEmail(user["email"]["email"], { autosave: false })
        if (!user["phone"]["isVerified"])
            user["login_tokens"] = []
    }
    if (user.isModified("phone.phone")) {
        await user.changePhone(user["phone"]["phone"], { autosave: false })
        if (!user["email"]["isVerified"])
            user["login_tokens"] = []
    }
    if (user.isModified("password")) {
        await user.changePassword(user["password"], { autosave: false })
        user["login_tokens"] = []
    }

    return next()
})

module.exports = mongoose.model("user", schema)