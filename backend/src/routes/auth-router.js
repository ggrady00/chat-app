const { postNewUser, postLogIn, postLogOut, getProfile } = require("../controllers/auth-controllers")
const {authenticateToken} = require("../middleware/auth")

const authRouter = require("express").Router()

authRouter
.route("/register")
.post(postNewUser)

authRouter
.route("/login")
.post(postLogIn)

authRouter
.route("/logout")
.post(postLogOut)

authRouter
.route("/profile")
.get(authenticateToken, getProfile)

module.exports = authRouter