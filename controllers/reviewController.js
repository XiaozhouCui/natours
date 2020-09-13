const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // allow nested routes (GET /tour/:tourId/reviews)
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  // nested route will find reviews for a particular tourId
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

// Middleware to be added in front of createOne(), to allow nested routes
exports.setTourUserIds = (req, res, next) => {
  // allow nested routes (POST /tour/:tourId/reviews)
  // can still manually define tour and user in req.body
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// DRY: use generic factory functions to handle reviews
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
