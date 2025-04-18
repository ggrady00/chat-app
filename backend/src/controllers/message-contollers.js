const User = require("../models/auth-models")
const Message = require("../models/message-model")
const cloudinary = require("../lib/cloudinary")
const { default: mongoose } = require("mongoose")
const { getReceiverSocketId, io } = require("../lib/socket")

exports.getUsersForSidebar = async (req, res, next) => {
    const loggedInUser = req.userId
    try {
        const users = await User.find({_id: {$ne:loggedInUser}}).select("-password")
        res.status(200).send({users})
        
    } catch (error) {
        next(error)
    }
}

exports.getMessagesByUserId = async (req, res, next) => {
    const myId = req.userId
    const chatterId = req.params.id
    if(!mongoose.Types.ObjectId.isValid(chatterId)) return res.status(400).send({msg: "Invalid Id"})
    try {
        const messages = await Message.find({
            $or: [
                {senderId:myId, receiverId:chatterId},
                {senderId: chatterId, receiverId: myId}
            ]
        })
        res.status(200).send({messages})
    } catch (error) {
        next(error)
    }
}

exports.sendMessageByUserId = async (req, res, next) => {
    const loggedInUser = req.userId
    const receiverId = req.params.id
    const {text, image} = req.body
    if(!text && !image) return res.status(400).send({msg: "Bad Request"})
    if(!mongoose.Types.ObjectId.isValid(receiverId)) return res.status(400).send({msg: "Invalid Id"})
    try {
        let imageUrl;
        if(image) {
            const upload = await cloudinary.uploader.upload(image)
            imageUrl = upload.secure_url
        }

        const newMessage = new Message({
            senderId: loggedInUser,
            receiverId,
            text,
            image: imageUrl
        })
        await newMessage.save()

        const receiverSocketId = getReceiverSocketId(receiverId)
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.status(201).send({message: newMessage})
    } catch (error) {
        console.log(error.msg)
        next(error)
    }
}