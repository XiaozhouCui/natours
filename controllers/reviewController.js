const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
// const catchAsync = require('../utils/catchAsync');

// Middleware to be added in front of createOne(), to allow nested routes
exports.setTourUserIds = (req, res, next) => {
  // allow nested routes (POST /tour/:tourId/reviews)
  // can still manually define tour and user in req.body
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// DRY: use generic factory functions to handle reviews
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
