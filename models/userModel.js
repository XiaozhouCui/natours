const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [
      validator.isEmail, // custom validator using 3rd party validator
      'Please provide a valid email',
    ],
  },
  photo: String,
  role: {
    type: String,
    numu: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false, // don't send out passwords in responses
  },
  // passwordConfirm is only required for input, not exist in DB
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        // if confirm password is identical to password, return true
        return el === this.password; // "this" point to current document only on NEW doc creation.
      },
      message: 'Two passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// DOCUMENT MIDDLEWARE

// Encryp password before it is saved into DB
userSchema.pre('save', async function (next) {
  // "this" refers to current document
  if (!this.isModified('password')) return next();
  // use bcryptjs to asynchronously hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // delete passwordConfirm field before saving to DB
  this.passwordConfirm = undefined;
  next();
});

// Instance method: password verification for login
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // return "true" if verified successfully
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method: handle password change after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // "this" current document
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }
  // "false" means NOT changed password (default value)
  return false;
};

// Instance method: generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  // use Node built-in "crypto" module to generate a temporary token for user to reset password
  const resetToken = crypto.randomBytes(32).toString('hex');
  // store temporary token in DB
  this.passwordResetToken = crypto
    .createHash('sha256') // use "sha256" algorithm
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  // set the token to auto expire after 10 nimutes.
  this.passwordResetExpires = Date.now() + 10 * 1000 * 60;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
