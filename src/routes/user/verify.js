const Router = require("express").Router()
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
        console.error(e)
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})

module.exports = Router