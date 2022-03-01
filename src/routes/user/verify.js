const Router = require("express").Router()
const LoginTokenUnverifiedAuth = require("../../middlewares/login_token.unverified.auth")
const Verification = require("../../models/verify")
const User = require("../../models/user")

Router.get("/user/verify", async (req, res, next) => {
    try {
        const query = req.query

        const verification_token = query["token"]

        if (!verification_token)
            return res.status(400).send({
                error: "missingToken",
                result: {}
            })

        const verification = await Verification.completeVerification(verification_token)
        if (!verification)
            return res.status(404).send({
                error: "verificationNotFound",
                result: {}
            })

        var user
        if (verification["type"] === "email")
            user = await User.findOne({ "email.email": verification["value"] }).exec()
        else if (verification["type"] === "phone")
            user = await User.findOne({ "phone.phone": verification["value"] }).exec()
        else if (verification["type"] === "password")
            user = await User.findOne({ "email.email": verification["target"] }).exec()

        await user.completeVerification(verification)

        return res.status(200).send({
            error: null,
            result: null
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})

Router.post("/user/verify/requestEmail", LoginTokenUnverifiedAuth, async (req, res, next) => {
    try {
        if (req.user["email"]["isVerified"])
            return res.status(403).send({
                error: "emailAlreadyVerified",
                result: {}
            })

        const body = req.body
        const email = body["email"]
        if (!email)
            await req.user.changeEmail(req.user["email"]["email"], { autosave: false })
        else
            req.user["email"]["email"] = email

        await req.user.save()

        return res.status(200).send({
            error: null,
            result: {}
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})
Router.post("/user/verify/requestPhone", LoginTokenUnverifiedAuth, async (req, res, next) => {
    try {
        if (req.user["phone"]["isVerified"])
            return res.status(403).send({
                error: "phoneAlreadyVerified",
                result: {}
            })

        const body = req.body
        const phone = body["phone"]
        if (!phone)
            await req.user.changePhone(req.user["phone"]["phone"], { autosave: false })
        else
            req.user["phone"]["phone"] = phone

        await req.user.save()

        return res.status(200).send({
            error: null,
            result: {}
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})

module.exports = Router