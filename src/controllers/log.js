/* globals AppError */
import fs from 'fs';
import path from 'path';

export let LogController = {
  findOne: function* () {
    let file = path
      .resolve(process.env.COMMAND_LOGS_DIR, this.params.id + '.log');
    try {
      yield new Promise(function(resolve, reject) {
        fs.stat(file, function(err, stat) {
          if (err) return reject(err);
          resolve(stat);
        });
      });
      this.body = fs.createReadStream(file);
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new AppError('NOT_FOUND', `${this.path} log does not exist.`);
      } else {
        throw err;
      }
    }
  }
};
