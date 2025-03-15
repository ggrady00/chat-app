const { postNewUser, postLogIn, postLogOut, getProfile } = require("../controllers/auth-controllers")

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
.get(getProfile)

module.exports = authRouter