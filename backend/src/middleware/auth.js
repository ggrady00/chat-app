const jwt = require("jsonwebtoken")

exports.authenticateToken = (req, res, next) => {
    const token = req.cookies.jwt

    if(!token) return res.status(401).send({msg: "Missing Token"})

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (decoded) {
            req.userId = decoded.userId
            next()
        } else {
            if(err instanceof jwt.TokenExpiredError) {
                return res.status(401).send({msg: "Expired Token"})
            }
            return res.status(401).send({msg: "Invalid Token"}) 
        }
    })
}