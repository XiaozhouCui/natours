const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400); // isOperational = true
};

const handleDuplicateFieldsDB = err => {
  const message = `Duplicate field value: '${err.keyValue.name}'. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationsErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack, // error stack trace
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown error: don't leak error details to clients
  } else {
    // 1) Log error
    console.error('ERROR!', err);
    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

// EXPRESS GLOBAL ERROR HANDLING MIDDLEWARE: first arg = err

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // if not defined, use 500 (internal server error)
  err.status = err.status || 'error'; // err.status = 'fail' if status = 404

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // customise MongoDB error handling
    if (error.name === 'CastError' || error.kind === 'ObjectId')
      error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error._message === 'Validation failed')
      error = handleValidationsErrorDB(error);

    sendErrorProd(error, res);
  }
};
