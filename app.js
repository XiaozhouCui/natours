const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  // log req and res info
  app.use(morgan('dev'));
}

// convert json into js object as req.body
app.use(express.json());
// serve static files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) ROUTES
// mount new router as middleware
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// catch all unhandled url
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = 'fail';
  err.statusCode = 404;
  // If any arg is passed in next(), it will be considered an error obj and will
  // skip all other middlewares and go straight to the global error handling middleware
  next(err);
});

// Global error handling middleware: first arg = err
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // if not defined, use 500 (internal server error)
  err.status = err.status || 'error'; // err.status = 'fail' if status = 404
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
