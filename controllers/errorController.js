// Global error handling middleware: first arg = err
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // if not defined, use 500 (internal server error)
  err.status = err.status || 'error'; // err.status = 'fail' if status = 404
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
