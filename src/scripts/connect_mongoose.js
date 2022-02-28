const mongoose = require("mongoose")

const URL = process.env.MONGODB_URL
mongoose.connect(URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => console.log("Mongoose connected"))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })