import {exec} from 'child_process';
import _ from 'lodash';
import {EventEmitter} from 'events';

export default class Command {

  /**
   * Execute command
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.cwd
   * @param {string} params.env
   * @param {string} params.timeout
   * @param {string} params.command
   */
  constructor(options) {
    this.options = _.merge({
      timeout: 60000,
      env: {},
      cwd: '.'
    }, options);

    this.status = 'PENDING';
    this.stderr = new EventEmitter();
    this.stdout = new EventEmitter();
  }

  run() {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.process = exec(self.options.command, _.pick(self.options, [
        'cwd',
        'env',
        'timeout'
      ]), function(err) {
        if (err) {
          self.status = 'FAILED';
          return reject(err);
        }
        self.status = 'SUCCEEDED';
        resolve();
      });

      self.status = 'STARTED';

      self.process.stdout.on('data', function(data) {
        self.stdout.emit('data', data);
      });

      self.process.stderr.on('data', function(data) {
        self.stderr.emit('data', data);
      });
    });
  }
}
