const express = require("express")
const authRouter = require("./routes/auth-router")
const { handleMongoErrors, handleCustomErrors } = require("./errors")


const app = express()
app.use(express.json())

app.use("/api/auth", authRouter)

app.use(handleCustomErrors)
app.use(handleMongoErrors)

module.exports = app