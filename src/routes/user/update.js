const Router = require("express").Router()
const multer = require("multer")

const LoginTokenAuth = require("../../middlewares/login_token.auth")
const Storage = require("../../utils/firebase.storage")

// Multer setup
const upload = multer({ dest: 'uploads/' })

Router.post("/user/update", LoginTokenAuth, async (req, res, next) => {
    try {
        const body = req.body

        const data = body["data"]
        if (!data)
            return res.status(400).send({
                error: "missingData",
                result: {}
            })

        if ("full_name" in data)
            req.user["full_name"] = data["full_name"]
        if ("email" in data)
            req.user["email"]["email"] = data["email"]
        if ("phone" in data)
            req.user["phone"]["phone"] = data["phone"]

        await req.user.save()

        // Delete sensitive fields
        req.user["password"] = null
        req.user["login_tokens"] = null
        req.user["two_factor_auth"] = null

        return res.status(200).send({
            error: null,
            result: {
                user: req.user
            }
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})

Router.post("/user/avatar", LoginTokenAuth, upload.single("avatar"), async (req, res, next) => {
    try {
        const query = req.query

        const id = query["id"]

        await Storage.uploadFile(`uploads/${req.file["filename"]}`, `${id}.png`)
        // Delete local file
        require("fs").unlinkSync(`uploads/${req.file["filename"]}`)

        req.user["avatar_url"]["url"] = await Storage.generateUrl(`${id}.png`)
        req.user["avatar_url"]["last_refreshed"] = Date.now()
        await req.user.save()

        // Delete sensitive fields
        req.user["password"] = null
        req.user["login_tokens"] = null
        req.user["two_factor_auth"] = null

        return res.status(200).send({
            error: null,
            result: {
                user: req.user
            }
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})
Router.delete("/user/avatar", LoginTokenAuth, async (req, res, next) => {
    try {
        const query = req.query

        const id = query["id"]

        await Storage.deleteFile(`${id}.png`)

        req.user["avatar_url"]["url"] = null
        req.user["avatar_url"]["last_refreshed"] = null
        await req.user.save()

        // Delete sensitive fields
        req.user["password"] = null
        req.user["login_tokens"] = null
        req.user["two_factor_auth"] = null

        return res.status(200).send({
            error: null,
            result: {
                user: req.user
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