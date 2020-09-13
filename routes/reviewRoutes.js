const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// when {mergeParams: true}, all following routes will end up in this handler
// POST /tour/:tourId/reviews (NESTED ROUTE)
// GET /tour/:tourId/reviews (NESTED ROUTE)
// POST /reviews (NORMAL ROUTE)

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    reviewController.createReview
  );

module.exports = router;
