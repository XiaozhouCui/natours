const dotenv = require('dotenv');

// updata the process.env with config.env
dotenv.config({ path: './config.env' });
// console.log(process.env);

// load app file AFTER dotenv.config()
const app = require('./app');

// console.log(app.get('env')); // same as process.env.NODE_ENV

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
