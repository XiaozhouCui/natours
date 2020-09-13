const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Generic factory function to handle CRUD for all Models

exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) return next(new AppError('No document found with that ID', 404));

    // 204 no content
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

exports.updateOne = Model => {
  return catchAsync(async (req, res, next) => {
    // findByIdAndUpdate() can't use Model's pre-save middlewares, hence can't change password
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // use Model's validation for update
    });

    if (!doc) return next(new AppError('No document found with that ID', 404));

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

exports.createOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      requestedAt: req.requestTime,
      data: {
        data: doc,
      },
    });
  });
};
