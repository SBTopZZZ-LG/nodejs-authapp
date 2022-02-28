const Router = require("express").Router()
const User = require("../../../models/user")
const Verification = require("../../../models/verify")

Router.post("/user/auth/resetPassword", async (req, res, next) => {
    try {
        const query = req.query
        const body = req.body

        const email = query["email"]
        if (!email)
            return res.status(400).send({
                error: "missingEmail",
                result: {}
            })

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

        if (!(await User.findOne({ "email.email": email }).exec()))
            return res.status(404).send({
                error: "emailDoesNotExist",
                result: {}
            })

        await Verification.createResetPasswordVerification(email, new_password)

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

module.exports = Router