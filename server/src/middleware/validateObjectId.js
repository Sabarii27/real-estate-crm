const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

// Validates one or more :param route params are valid Mongo ObjectIds,
// returning a clean 400 instead of letting an invalid id reach Mongoose (CastError).
const validateObjectId = (...paramNames) => {
  const params = paramNames.length ? paramNames : ['id'];
  return (req, res, next) => {
    for (const param of params) {
      const value = req.params[param];
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new ApiError(400, `Invalid id provided for '${param}'`);
      }
    }
    next();
  };
};

module.exports = validateObjectId;
