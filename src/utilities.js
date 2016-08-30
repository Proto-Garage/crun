import path from 'path';
import _ from 'lodash';
import bcrypt from 'bcryptjs';

/**
 * Require all files inside a directory
 * @param {string} dir
 * @param {string} namespace
 */
export function dynamicRequire(dir, namespace) {
  let normalizedPath = path.join(__dirname, dir);
  let files = require('fs').readdirSync(normalizedPath);
  _.each(files, file => {
    let mod = require(path.resolve(__dirname, dir, file));
    if (namespace) {
      global[namespace] = mod;
    } else {
      _.merge(global, mod);
    }
  });
}

/**
 * Calculate bcrypt hash
 * @param {string} message
 */
export function bcryptHash(message) {
  return new Promise(function(resolve, reject) {
    bcrypt.hash(message, 10, function(err, result) {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Compare bcrypt hash
 * @param {string} message
 */
export function bcryptCompare(message, hash) {
  return new Promise(function(resolve, reject) {
    bcrypt.compare(message, hash, function(err, result) {
      if (err) return reject(err);
      resolve(result);
    });
  });
}
