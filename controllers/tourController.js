const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ALIAS MIDDLEWARE
// pre-process req.query without URL query strings
exports.aliasTopTours = (req, res, next) => {
  // "?sort=-ratingsAverage,price&limit=5"
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// ROUTE HANDLERS

// use catchAsync() wrapper function to get rid of try-catch blocks
exports.getAllTours = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const tours = await features.query; // await all above chained query methods

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours: tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // req.params are strings, may need to be converted into obj
  // VIRTUAL POPULATE reviews
  const tour = await Tour.findById(req.params.id).populate('reviews');

  if (!tour) return next(new AppError('No tour found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // const newTour = new Tour({});
  // newTour.save();
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    requestedAt: req.requestTime,
    data: {
      tour: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true, // use tourModel's validation for update
  });

  if (!tour) return next(new AppError('No tour found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) return next(new AppError('No tour found with that ID', 404));

  // 204 no content
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// AGGREGATION PIPELINES

exports.getTourStats = catchAsync(async (req, res, next) => {
  // await the aggregation obj
  const stats = await Tour.aggregate([
    {
      // stage-1: filter
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      // stage-2: get stats by groups
      $group: {
        _id: { $toUpper: '$difficulty' }, // Group by which field (like SQL group by)
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 }, // add 1 for each tour to get total number of tours
        numRatings: { $sum: '$ratingsQuantity' }, // total number of ratings
        avgRating: { $avg: '$ratingsAverage' }, // average rating
        avgPrice: { $avg: '$price' }, // average price
        minPrice: { $min: '$price' }, // minimum price
        maxPrice: { $max: '$price' }, // maximum price
      },
    },
    {
      // stage-3: sort
      $sort: { avgPrice: 1 }, // use stage-2 field "avgPrice", 1 for ascending order
    },
    // // repeat stage-1: additional filter by "_id" defined in stage-2
    // {
    //   $match: { _id: { $ne: 'EASY' } }, // _id (difficulty) not equal to 'EASY'
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      // stage-1: unwind 3 elements in startDates array to form 3 Tours, each Tour has only 1 startDate as string
      $unwind: '$startDates',
    },
    {
      // stage-2: filter start dates to be in year 2021
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      // stage-3: group by the month in startDates
      $group: {
        _id: { $month: '$startDates' }, // $month is a Mongo aggregation operator
        numTourStarts: { $sum: 1 }, // count number of tours in each month group
        tours: { $push: '$name' }, // push all tour names into an ARRAY
      },
    },
    {
      // stage-4: add new field name for "_id" in stage-3
      $addFields: { month: '$_id' },
    },
    {
      // stage-5: hide original field "_id"
      $project: { _id: 0 },
    },
    {
      // stage-6: sort by number of tours in each month group
      $sort: { numTourStarts: -1 }, // -1 for descending order
    },
    {
      // stage-7: limit number of documents to 12
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
