const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // error message if undefined
      unique: true, // no duplicate name allowed
      trim: true, // remove white space
      maxlength: [40, 'A tour name must have no more than 40 characters'],
      minlength: [10, 'A tour name must have at least 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'], // custom validator using 3rd party validator
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficluty'],
      trim: true,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, diffidult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Maximum rating is 5.0'],
      set: val => Math.round(val * 10) / 10, // 4.666666 => 46.66666 => 47 => 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // custom validator: callbacks which return true/false
      validate: {
        validator: function (val) {
          // if discounted price is less than normal price, return true
          return val < this.price; // "this" point to current document only on NEW doc creation.
        },
        message: 'Discount price ({VALUE}) must be lower than regular price.',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // array of strings
    createdAt: {
      type: Date,
      default: Date.now(), // mongoose will auto parse date
      select: false, // createdAt will be hidden from query output
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    // DO NOT reference indefinitely growing array (reviews)
    // reviews: [{ type: mongoose.Schema.ObjectId, ref: 'Review' }],
  },
  // options
  {
    // allow virtual properties: not stored in db but used in calculation/res
    toJSON: { virtuals: true }, // virtual properties to be part of json output
    toObject: { virtuals: true }, // virtual properties to be part of object output
  }
);

// DB INDEX

// tourSchema.index({ price: 1 }); // use index to improve GET performance
tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 for ascending order; -1 for descending
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// VIRTUAL PROPERTIES (not saved in db)

// only show "durationWeeks" in response, not in db
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; // "this" refers to current document - no arrow function here
});

// Virtually POPULATED reviews
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // "tour" field in Review model
  localField: '_id', // '_id' in local Tour model is called "tour" in Reivew model
});

// DOCUMENT MIDDLEWARE

// pre() middleware: runs before .save() and .create() (but not .insertMany())
tourSchema.pre('save', function (next) {
  // console.log(this); // "this" point to currently processed document
  this.slug = slugify(this.name, { lower: true }); // add a new field "slug": "test-tour-1"
  next();
});

// // Save embeded "guides" documents when creating new tours
// tourSchema.pre('save', async function (next) {
//   // Initially, guides is an array of IDs
//   const guidesPromises = this.guides.map(async id => await User.findById(id)); // array of promises
//   this.guides = await Promise.all(guidesPromises); // guides is now an array of documents
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// // post(): run after pre() middleware
// tourSchema.post('save', function (doc, next) {
//   console.log(doc); // doc is the final document (containing slug)
//   next();
// });

// QUERY MIDDLEWARE

// run before .find(), .findOne(), .findOneAndDelete(), .findOneAndUpdate() etc.
tourSchema.pre(/^find/, function (next) {
  // "this" point to the current query, not document
  this.find({ secretTour: { $ne: true } }); // filter out secretTours
  // set new property to "this" query object
  this.start = Date.now();
  next();
});

// populate guides ObjectIds
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  // console.log(docs); // docs refer to just processed documents
  next();
});

// AGGREGATION MIDDLEWARE

// tourSchema.pre('aggregate', function (next) {
//   // "this" point to current aggregation object
//   // console.log(this.pipeline()); // pipeline is the array of aggregate stages
//   // add new $match filter as the first element of pipeline array (before stage-1)
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
