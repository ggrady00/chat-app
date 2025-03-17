const express = require("express")
const authRouter = require("./routes/auth-router")
const messageRouter = require("./routes/message-router")
const { handleMongoErrors, handleCustomErrors } = require("./errors")
const cookieParser = require("cookie-parser")

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/message", messageRouter)

app.use(handleCustomErrors)
app.use(handleMongoErrors)

module.exports = app