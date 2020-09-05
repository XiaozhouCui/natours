const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
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
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware IN EXPRESS
app.use(globalErrorHandler);

module.exports = app;
