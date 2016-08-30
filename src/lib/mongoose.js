import mongoose from 'mongoose';
import Promise from 'bluebird';

mongoose.Promise = Promise;

let db = mongoose.createConnection(process.env.MONGODB_URL);
db.on('error', function(err) {
  console.error(err);
});
db.connected = new Promise(function(resolve) {
  db.once('connected', resolve);
});
export default db;
