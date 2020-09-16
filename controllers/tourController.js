const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
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

// DRY: use generic factory functions to replace old function
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

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

// '/tours-within/:distance/center/:latlng/unit:unit'
// '/tours-within/233/center/-27.563582,153.062733/unit/mi'

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Relative distance divided by the radius of the earth!
  // 'mi' stands for miles
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and logitude in the format lat,lng.',
        400
      )
    );
  }

  // $geoWithin: draw a circle on map to FILTER tours by the startLocation
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // convert meters to miles or kilometers
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and logitude in the format lat,lng.',
        400
      )
    );
  }

  // Aggregation pipeline
  const distances = await Tour.aggregate([
    // Stage 1: $geoNear is always the first stage
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier, // convert from meter to kilometer
      },
    },
    // Stage 2: keep only the selected fields
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
