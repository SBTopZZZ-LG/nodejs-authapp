// TODO: Use a rate limiter

// Scripts
require("dotenv").config()
require("./scripts/connect_mongoose")
const app = require("./scripts/start_express")

// Express user-agent
app.use(require("express-useragent").express())

// Routes
app.use(require("./routes/user"))
app.use(require("./routes/user/2fa"))
app.use(require("./routes/user/2fa/disable"))
app.use(require("./routes/user/2fa/enable"))
app.use(require("./routes/user/auth"))
app.use(require("./routes/user/auth/reset.password"))
app.use(require("./routes/user/update"))
app.use(require("./routes/user/verify"))