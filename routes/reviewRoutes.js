const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// when {mergeParams: true}, all following routes will end up in this handler
// POST /tour/:tourId/reviews (NESTED ROUTE)
// GET /tour/:tourId/reviews (NESTED ROUTE)
// POST /reviews (NORMAL ROUTE)

router.route('/').get(reviewController.getAllReviews).post(
  authController.protect,
  authController.restrictTo('admin', 'user'),
  reviewController.setTourUserIds, // middleware to allow nested routes
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
