const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// AUTHENTICATION ROUTES (NO PROTECTION)

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// PROTECTED USER ROUTES START HERE

router.use(authController.protect); // Protects ALL routes AFTER this middleware

// CURRENT USER ROUTES

router.patch('/updateMyPassword', authController.updatePassword);
router.get(
  '/me',
  userController.getMe, // middleware to set req.params.id
  userController.getUser // users/:id is acquired from getMe middleware
);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// ADMIN-ONLY ROUTES STARTS HERE

router.use(authController.restrictTo('admin')); // Restrict ALL routes AFTER this middleware

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
