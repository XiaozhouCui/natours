const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// SEND TOKEN & COOKIE
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // cookie expires after * days
    ),
    httpOnly: true, // cookie won't be modified by browser
  };
  // secure = true: only send cookie via httpS, only in production
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // send token in COOKIE
  res.cookie('jwt', token, cookieOptions);

  // don't send password to client after SIGNUP.
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// SIGN UP FUNCTION

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); // DANGER: user could creat ADMIN account!
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

// LOGIN FUNCTION

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist in req
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email: email }).select('+password'); // select('+password') because in User model, password: {select: false}

  // user.correctPassword() compares passwords and returns true/false
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); // 401 unauthorised
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

// JWT AUTHENTICATION MIDDLEWARE

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it exists in header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  // 2) Verify token: if token is modified or expired
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists (for deleted users)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user holding this token no longer exist', 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please login again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE AND SET req.user
  req.user = currentUser;
  next();
});

// ROLE AUTHORISATION MIDDLEWARE (must come AFTER jwt auth middleware)

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'lead-guide']
    // console.log(roles);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// REST FORGOTTEN PASSWORD MIDDLEWARES

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }
  // 2) Generate the random token
  const resetToken = user.createPasswordResetToken(); // generate token, set auto-expiry in 10min
  await user.save({ validateBeforeSave: false }); // store temperory token in DB

  // 3) Send it to user's email
  // req.protocol is "http" or "https"
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    // if send email failed, clear token and expiry date from DB
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again lager!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256') // must be the same algorithm as in instance method
    .update(req.params.token) // un-encrypted token in email link
    .digest('hex');

  // hash token and compared with the encrypted token in DB
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 3) Update changedPasswordAt property for the user:
  // user.passwordChangedAt = Date.now(); // handled by pre-save middleware
  await user.save();

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

// LOGGED IN USERS UPDATE THEIR OWN PASSWORDS
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const { passwordCurrent, password, passwordConfirm } = req.body;
  // Do NOT use findByIdAndUpdate() on passwords, validation and pre-save middlewares won't work!
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct (ask user to enter old password)
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  // 3) If so, update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  // user.passwordChangedAt = Date.now(); // handled by pre-save middleware
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
