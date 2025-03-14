const { postNewUser, postLogIn, postLogOut } = require("../controllers/auth-controllers")

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

module.exports = authRouter