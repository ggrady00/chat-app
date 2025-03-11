const app = require("./src/app")
const dotenv = require("dotenv")
const {connectDB} = require("./src/lib/db")

dotenv.config({path: ".env.development"})
const PORT = process.env.PORT


app.listen(PORT, () => {
    console.log(`Listening on PORT:${PORT}`)
    connectDB()
})