const app = require("./src/app")
const dotenv = require("dotenv")
const {connectDB} = require("./src/lib/db")


const ENV = process.env.NODE_ENV || "development"

require("dotenv").config({
    path: `.env.${ENV}`
})

const PORT = process.env.PORT



app.listen(PORT, () => {
    console.log(`Listening on PORT:${PORT}`)
    connectDB()
})