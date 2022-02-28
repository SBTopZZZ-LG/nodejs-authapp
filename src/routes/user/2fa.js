const Router = require("express").Router()
const LoginTokenAuth = require("../../middlewares/login_token.auth")

Router.post("/user/2fa", LoginTokenAuth, async (req, res, next) => {
    try {
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