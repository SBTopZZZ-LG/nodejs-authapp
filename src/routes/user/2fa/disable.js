const Router = require("express").Router()
const LoginTokenAuth = require("../../../middlewares/login_token.auth")

Router.patch("/user/2fa/disable", LoginTokenAuth, async (req, res, next) => {
    try {
        req.user["two_factor_auth"]["isEnabled"] = false
        await req.user.save()

        return res.status(200).send({
            error: null,
            result: {
                "2fa": req.user["two_factor_auth"]
            }
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})
Router.delete("/user/2fa/disable", LoginTokenAuth, async (req, res, next) => {
    try {
        req.user["two_factor_auth"]["isEnabled"] = false

        // Clear all fields
        req.user["two_factor_auth"]["first_question"]["question"] = null
        req.user["two_factor_auth"]["first_question"]["answer"] = null

        req.user["two_factor_auth"]["second_question"]["question"] = null
        req.user["two_factor_auth"]["second_question"]["answer"] = null

        req.user["two_factor_auth"]["third_question"]["question"] = null
        req.user["two_factor_auth"]["third_question"]["answer"] = null

        await req.user.save()

        return res.status(200).send({
            error: null,
            result: {
                "2fa": req.user["two_factor_auth"]
            }
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})

module.exports = Router