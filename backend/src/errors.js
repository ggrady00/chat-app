exports.handleMongoErrors = (err, req, res, next) => {
  if (err.code == "11000") {
    res.status(400).send({ msg: "Already Exists" });
  } else {
    next(err);
  }
};

exports.handleCustomErrors = (err, req, res, next) => {
    console.log("Custom err", err);
    if (err.status) {
    res.status(err.status).send({ msg: err.msg });
  } else {
    next(err);
  }
};
