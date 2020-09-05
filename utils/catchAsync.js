// Wrapper function to remove try-catch blocks:
// use catchAsync() to wrap an async function and return an anonymous function which
// calls the arg async func (returning a promise) chained with .catch() method
module.exports = asyncFunction => {
  return (req, res, next) => {
    asyncFunction(req, res, next).catch(err => next(err)); // passing any arg into next() will skip all middleware and directly go to global error handler
  };
};

// equivalent short hand:
// const catchAsync = fn => (req, res, next) => {
//   fn(req, res, next).catch(next);
// };
