const Router = require("express").Router()
const TwoFAAuth = require("../../../middlewares/2fa.auth")
const Verification = require("../../../models/verify")
const bcrypt = require("bcryptjs")

Router.post("/user/2fa/resetPassword", TwoFAAuth, async (req, res, next) => {
    try {
        const body = req.body

        const new_password = body["password"]
        if (!new_password)
            return res.status(400).send({
                error: "missingPassword",
                result: {}
            })

        if (typeof new_password !== "string")
            return res.status(400).send({
                error: "passwordIsNotAValidString",
                result: {}
            })

        if (new_password.length < 6)
            return res.status(400).send({
                error: "passwordIsTooShort",
                result: {}
            })
        else if (new_password.length > 16)
            return res.status(400).send({
                error: "passwordIsTooLong",
                result: {}
            })

        if (await bcrypt.compare(new_password, req.user["password"]))
            return res.status(403).send({
                error: "passwordsCanNotBeSame",
                result: {}
            })

        const email = req.user["email"]["email"]

        await Verification.createResetPasswordVerification(email, new_password)

        return res.status(200).send({
            error: null,
            result: null
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: null
        })
    }
})

module.exports = Router