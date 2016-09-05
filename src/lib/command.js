import {exec} from 'child_process';
import _ from 'lodash';
import {EventEmitter} from 'events';
import {v4 as uid} from 'node-uuid';
import path from 'path';
import fs from 'fs';

export default class Command extends EventEmitter {

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
    super();
    this.options = _.merge({
      timeout: 60000,
      env: {},
      cwd: '.'
    }, options);

    this.status = 'PENDING';
    this.stderr = new EventEmitter();
    this.stdout = new EventEmitter();
    this.instanceId = uid();
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
          self.emit('status', self.status);
          return reject(err);
        }
        self.status = 'SUCCEEDED';
        self.emit('status', self.status);
        resolve();
      });

      self.status = 'STARTED';
      let stream = fs.createWriteStream(
        path.resolve(process.env.COMMAND_LOGS_DIR, self.instanceId + '.log'), {
          encoding: 'utf8',
          flags: 'w'
        }
      );
      self.process.stdout.pipe(stream);
      self.process.stderr.pipe(stream);
      self.emit('status', self.status);

      self.process.stdout.on('data', function(data) {
        self.stdout.emit('data', data);
      });

      self.process.stderr.on('data', function(data) {
        self.stderr.emit('data', data);
      });
    });
  }
}
