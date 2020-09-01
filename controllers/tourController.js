const Tour = require('../models/tourModel');

// ROUTE HANDLERS

exports.getAllTours = async (req, res) => {
  try {
    // req.query: js object from query string "?duration=5&difficulty=easy&page=2"

    // BUILD QUERY
    // 1-A) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]); // excluded pagination parameters from query string

    // 1-B) Advanced Filtering: operators in query string >=, <=
    // "?difficulty=easy&duration[gte]=5&price[lt]=1500"
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr)); // { difficulty: 'easy', duration: { $gte: '5' }, price: { $lt: '1500' } }

    let query = Tour.find(JSON.parse(queryStr)); // don't await because need to sort and filter

    // 2) Sorting
    if (req.query.sort) {
      // "?sort=-price,ratingsAverage"
      const sortBy = req.query.sort.split(',').join(' ');
      // console.log(sortBy); // '-price ratingsAverage'
      // chain sort() to the query returned by Tour.find()
      query = query.sort(sortBy); // mongoose sort('-price ratingsAverage'): sort by price descending then by rating ascending
    } else {
      // default sorting
      query = query.sort('-ratingsQuantity');
    }

    // 3) Field limiting: only query the wanted properties
    // ?fields=name,duration,price&...
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields); // query.select('name duration price')
    } else {
      // by default, exclude the '__v' property in response
      query = query.select('-__v');
    }

    // EXECUTE QUERY
    const tours = await query;

    // const tours = await Tour.find()
    //   .where('duration')
    //   .gte(5)
    //   .where('difficulty')
    //   .equals('easy');

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: tours.length,
      data: {
        tours: tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    // req.params are strings, may need to be converted into obj
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tours: tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    // 204 no content
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
