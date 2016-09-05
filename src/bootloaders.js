import db from './lib/mongoose';
import fs from 'fs';

export default [
  function * initializeMongoose() {
    yield db.connected;
  },
  function * initializeLogsDirectory() {
    try {
      yield new Promise(function(resolve, reject) {
        fs.stat(process.env.COMMAND_LOGS_DIR, function(err, stat) {
          if (err) return reject(err);
          resolve(stat);
        });
      });
    } catch (err) {
      if (err.code === 'ENOENT') {
        yield new Promise(function(resolve, reject) {
          fs.mkdir(process.env.COMMAND_LOGS_DIR, 0o644, function(err) {
            if (err) return reject(err);
            resolve();
          });
        });
      } else {
        throw err;
      }
    }
  }
];
