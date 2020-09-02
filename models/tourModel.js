const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // error message if undefined
      unique: true, // no duplicate name allowed
      trim: true, // remove white space
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
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
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
  },
  {
    // options
    toJSON: { virtuals: true }, // virtual properties to be part of json output
    toObject: { virtuals: true }, // virtual properties to be part of object output
  }
);

// VIRTUAL PROPERTIES (not saved in db)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; // "this" refers to current document - no arrow function here
});

// DOCUMENT MIDDLEWARE
// pre() middleware: runs before .save() and .create() (but not .insertMany())
tourSchema.pre('save', function (next) {
  // console.log(this); // "this" point to currently processed document
  this.slug = slugify(this.name, { lower: true }); // add a new field "slug": "test-tour-1"
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// // post(): run after pre() middleware
// tourSchema.post('save', function (doc, next) {
//   console.log(doc); // doc is the final document (containing slug)
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
