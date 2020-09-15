// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review cannot be empty'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating'],
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Maximum rating is 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  // options
  {
    // virtual fields: not stored in db but used in calculation
    toJSON: { virtuals: true }, // virtual properties to be part of json output
    toObject: { virtuals: true }, // virtual properties to be part of object output
  }
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  // DO NOT populate tour in reviews because tour is already populating reviews VIRTUALLY
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// Add (Class level) static methods for the Model
// get stats of reviews for a selected tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // aggregation pipeline, "this" is the current Model (Review)
  const stats = await this.aggregate([
    // stage 1: match
    {
      $match: { tour: tourId },
    },
    // stage 2: group
    {
      $group: {
        _id: '$tour', // group by tour field in review doc
        nRating: { $sum: 1 }, // get total number of ratings
        avgRating: { $avg: '$rating' }, // get average rating for each tour
      },
    },
  ]);

  // console.log(stats); // [ { _id: 5f606a45afbc980788c5296a, nRating: 5, avgRating: 4.8 } ]

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};

// Call the calcAverageRatings() middleware each time when a new review is created
reviewSchema.post('save', function () {
  // "this" points to current review
  // "this.constructor" points to the current Model (Review)
  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
