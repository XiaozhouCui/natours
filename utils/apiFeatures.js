class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // arg1: Model.find()
    this.queryString = queryString; // arg2: req.query - js object from query string "?duration=5&difficulty=easy&page=2"
  }

  filter() {
    // 1-A) Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]); // excluded pagination parameters from query string

    // 1-B) Advanced Filtering: operators in query string >=, <=
    // "?difficulty=easy&duration[gte]=5&price[lt]=1500"
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr)); // { difficulty: 'easy', duration: { $gte: '5' }, price: { $lt: '1500' } }

    this.query.find(JSON.parse(queryStr)); // don't await because need to sort and filter

    return this; // return the object that can be chained by other methods
  }

  sort() {
    // 2) Sorting
    if (this.queryString.sort) {
      // "?sort=-price,ratingsAverage"
      const sortBy = this.queryString.sort.split(',').join(' ');
      // console.log(sortBy); // '-price ratingsAverage'
      // chain sort() to the query returned by Tour.find()
      this.query = this.query.sort(sortBy); // mongoose sort('-price ratingsAverage'): sort by price descending then by rating ascending
    } else {
      // default sorting
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // 3) Field limiting: only query the wanted properties
    // ?fields=name,duration,price&...
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); // this.query.select('name duration price')
    } else {
      // by default, exclude the '__v' property in response
      this.query = this.query.select('-__v');
    }

    return this;
  }

  pagination() {
    const page = Number(this.queryString.page) || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // "?page=3&limit=10"
    this.query = this.query.skip(skip).limit(limit); // skip 20 results to start from page 3

    return this;
  }
}

module.exports = APIFeatures;
