const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

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

exports.createReview = catchAsync(async (req, res, next) => {
  // allow nested routes (POST /tour/:tourId/reviews)
  // can still manually define tour and user in req.body
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    requestedAt: req.requestTime,
    data: {
      review: newReview,
    },
  });
});
