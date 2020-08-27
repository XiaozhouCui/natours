const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// chain different methods to their common route string
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
