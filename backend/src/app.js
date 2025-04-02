const express = require("express")
const {connectDB} = require("./lib/db")
const authRouter = require("./routes/auth-router")
const messageRouter = require("./routes/message-router")
const { handleMongoErrors, handleCustomErrors } = require("./errors")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const path = require("path")

const {app, server} = require("./lib/socket")


app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use("/api/auth", authRouter)
app.use("/api/message", messageRouter)

app.use(handleCustomErrors)
app.use(handleMongoErrors)

const ENV = process.env.NODE_ENV || "development"

require("dotenv").config({
    path: `.env.${ENV}`
})

const PORT = process.env.PORT

console.log(__dirname)

if(process.env.NODE_ENV == "production") {
    app.use(express.static(path.join(__dirname, "../../frontend/dist")))

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend", "dist", "index.html"))
    })
}

server.listen(PORT, () => {
    console.log(`Listening on PORT:${PORT}`)
    connectDB()
})
module.exports = app