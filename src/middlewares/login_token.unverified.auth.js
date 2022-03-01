const User = require("../models/user")

module.exports = async (req, res, next) => {
    try {
        const query = req.query
        const headers = req.headers

        const id = query["id"]
        if (!id)
            return res.status(400).send({
                error: "missingId",
                result: {}
            })

        const login_token = headers["authorization"]
        if (!login_token)
            return res.status(400).send({
                error: "missingLoginToken",
                result: {}
            })

        const user = await User.findById(id).exec()
        if (!user)
            return res.status(404).send({
                error: "invalidId",
                result: {}
            })

        if (!user["login_tokens"].filter(obj => obj["login_token"] === login_token).length)
            return res.status(403).send({
                error: "invalidLoginToken",
                result: {}
            })

        // Does not check if user's email or phone is verified or not

        await user.update() // Check/update avatar url

        req.user = user
        return next()
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
}