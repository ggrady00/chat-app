const User = require("../models/auth-models");
const { isValidEmail, generateToken } = require("../utils");
const bcrypt = require("bcryptjs");


exports.postNewUser = async (req, res, next) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).send({ msg: "Bad Request" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).send({ msg: "Invalid Email" });
  }
  if (password.length < 8) {
    return res.status(400).send({ msg: "Password too short" });
  }

  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    generateToken(newUser._id, res);

    res.status(201).send({
      user: {
        _id: newUser._id,
        fullName,
        email,
        profilePic: newUser.profilePic,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.postLogIn = async (req, res, next) => {
  const {email, password} = req.body
  if(!email || !password) res.status(400).send({msg:"Bad Request"})
  
  try {
    const user = await User.findOne({email})
    if(!user) res.status(400).send({msg: "Invalid Credentials"})
    const pwMatch = await bcrypt.compare(password, user.password)
    if(!pwMatch) res.status(400).send({msg:"Invalid Credentials"}) 
    
    generateToken(user._id, res)
    res.status(201).send({user : {
      _id: user._id,
      fullName: user.fullName,
      email,
      profilePic: user.profilePic,
      
    }})

  } catch (error) {
    next(error)
  }
};

exports.postLogOut = (req, res, next) => {
  try {
    res.cookie("jwt", "", {maxAge:0})
    res.status(200).send({msg: "Logged out"})
  } catch (error) {
    next(error)
  }
};

exports.getProfile = (req, res, next) => {
  console.log(req)
}