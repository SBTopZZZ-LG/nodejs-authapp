const Router = require("express").Router()
const LoginTokenAuth = require("../middlewares/login_token.auth")

Router.post("/user", LoginTokenAuth, async (req, res, next) => {
    try {
        const user = req.user

        // Delete sensitive fields
        user["password"] = null
        user["two_factor_auth"] = null

        return res.status(200).send({
            error: null,
            result: {
                user
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