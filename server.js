const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handle global exceptions outside Express middlewares (e.g. using undefined varables)
// This global error handler must be at the top, before app is called
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  process.exit(1);
});

// updata the process.env with config.env
dotenv.config({ path: './config.env' });
// console.log(process.env);

// load app file AFTER dotenv.config()
const app = require('./app');

// console.log(app.get('env')); // same as process.env.NODE_ENV

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 3001; // if not defined, use port 3001;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handle global promise rejections outside Express middlewares (e.g. DB connection problem)
// This global error handler must be at the bottom, after server listener
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(1);
  });
});
