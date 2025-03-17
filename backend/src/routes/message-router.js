const { getUsersForSidebar, sendMessageByUserId } = require("../controllers/message-contollers")
const {authenticateToken} = require("../middleware/auth")


const messageRouter = require("express").Router()

messageRouter
.route("/users")
.get(authenticateToken, getUsersForSidebar)

messageRouter
.route("/:id")
.post(authenticateToken, sendMessageByUserId)

module.exports = messageRouter