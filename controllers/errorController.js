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

const handleJWTError = () =>
  new AppError('Invalid token. Please login again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expred. Please login again!', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack, // error stack trace
    });
  }

  // B) RENDERED WEBSITE (error.pug)
  console.error('ERROR!', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Programming or other unknown error: don't leak error details to clients
    // 1) Log error
    console.error('ERROR!', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // Programming or other unknown error: don't leak error details to clients
  // 1) Log error
  console.error('ERROR!', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

// EXPRESS GLOBAL ERROR HANDLING MIDDLEWARE: first arg = err

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // if not defined, use 500 (internal server error)
  err.status = err.status || 'error'; // err.status = 'fail' if status = 404

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message; // fix bug

    // customise MongoDB ObjectID error handling
    if (error.name === 'CastError' || error.kind === 'ObjectId')
      error = handleCastErrorDB(error);
    // customise duplicate field values
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    // customise mongoose validation error handling
    if (error._message === 'Validation failed')
      error = handleValidationsErrorDB(error);
    // customise JWT verification error handling (modified JWT)
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    // customise JWT expiry error handling
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
