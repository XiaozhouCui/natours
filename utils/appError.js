// AppError class will only handle the operational errors (not programming errors or bugs)
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // don't want the error stack trace be polluted by this class
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
