import db from './lib/mongoose';

export default [
  function * initializeMongoose() {
    yield db.connected;
  }
];
