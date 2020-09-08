const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

// Param middleware
// router.param('id', tourController.checkId);

// Alias: pre-fill the query object before going to getAllTours
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours); // alias middleware

// Aggregation piplines
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

// chain different methods to their common route string
router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  // .post(tourController.checkBody, tourController.createTour); // inserted checkBody middleware
  .post(tourController.createTour); // inserted checkBody middleware
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
