const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

// Param middle ware
router.param('id', tourController.checkId);

// chain different methods to their common route string
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
