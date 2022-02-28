const Router = require("express").Router()
const User = require("../../models/user")

Router.post("/user/auth/signup", async (req, res, next) => {
    try {
        const body = req.body

        const data = body["data"]
        if (!data) // Data missing
            return res.status(400).send({
                error: "missingData",
                result: {}
            })

        const full_name = data["full_name"]
        const email = data["email"]
        const phone = data["phone"]
        const password = data["password"]
        if (!full_name || !email || !phone || !password) // Missing fields
            return res.status(400).send({
                error: "missingFields",
                result: {}
            })

        const user = await User.createUser(full_name, email, phone, password)
        // Delete sensitive fields
        user["password"] = null
        user["two_factor_auth"] = null
        user["login_tokens"] = null

        return res.status(200).send({
            error: null,
            result: {
                user: user
            }
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})
Router.post("/user/auth/signin", async (req, res, next) => {
    try {
        const body = req.body

        const email = body["email"]
        const phone = body["phone"]
        const password = body["password"]
        if ((!email && !phone) || !password)
            return res.status(400).send({
                error: "missingFields",
                result: {}
            })

        const user = await User.signIn(email, phone, password)
        const login_token = await user.generateLoginToken(`${req.useragent.os ?? req.useragent.platform} (${req.useragent.version})`, { autosave: true })

        // Delete sensitive fields
        user["password"] = null
        user["two_factor_auth"] = null
        user["login_tokens"] = null

        return res.status(200).send({
            error: null,
            result: {
                user: user,
                login_token
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