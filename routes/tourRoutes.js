const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Param middleware
// router.param('id', tourController.checkId);

// NESTED ROUTES

// POST /tour/:tourId/reviews
// GET /tour/:tourId/reviews

// if NESTED route containes "/:tourId/reviews", redirect req to reviewRouter.
router.use('/:tourId/reviews', reviewRouter);

// Alias: pre-fill the query object before going to getAllTours
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours); // alias middleware

// Aggregation piplines
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// GEOSPATIAL QUERIES

// Finding Tours Within Radius
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// chain different methods to their common route string
router
  .route('/')
  .get(tourController.getAllTours)
  // .post(tourController.checkBody, tourController.createTour); // inserted checkBody middleware
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
