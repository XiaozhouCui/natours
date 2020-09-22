const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template
  // 3) Render that template using tour data from 1)

  res
    .status(200)
    .header('Content-Security-Policy', "worker-src 'self' blob:")
    .render('overview', {
      title: 'All Tours',
      tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get data for the requested tour (including reviews and tour guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  // 2) Build template
  // 3) Render that template using tour data from 1)
  res
    .status(200)
    .header('Content-Security-Policy', "worker-src 'self' blob:")
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .header('Content-Security-Policy', "worker-src 'self' blob:")
    .render('login', {
      title: 'Log into your account',
    });
};
