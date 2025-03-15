const jwt = require("jsonwebtoken")

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email)
}

function generateToken(userId, res) {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "1h"
    })

    res.cookie("jwt", token, {
        maxAge: 60*60*1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development"

    })
    return token
}

module.exports = {isValidEmail, generateToken}