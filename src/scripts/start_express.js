const express = require("express")

const app = express()
app.use(express.json())
app.use(require("cors")())

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("Express server listening on port", PORT))

module.exports = app