const ratelimit = require("express-rate-limit")

const limiter = ratelimit({
    windowMs: 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
})

module.exports = (app) => app.use(limiter)