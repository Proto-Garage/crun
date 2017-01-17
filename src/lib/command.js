import {exec} from 'child_process';
import _ from 'lodash';
import {EventEmitter} from 'events';
import {v4 as uid} from 'uuid';
import path from 'path';
import fs from 'fs';
import STATUS from './status';

export default class Command extends EventEmitter {

  /**
   * Execute command
   * @param {object} params
   * @param {ObjectId} params.commandId
   * @param {string} params.name
   * @param {string} params.cwd
   * @param {string} params.env
   * @param {string} params.timeout
   * @param {string} params.command
   */
  constructor(options) {
    super();

    this.commandId = options.commandId;
    this.options = _.defaultsDeep(options, {
      timeout: 60000,
      env: {},
      cwd: '.'
    }, options);

    this.stderr = new EventEmitter();
    this.stdout = new EventEmitter();
    this.instanceId = uid();
    this._startedAt = null;
    this._elapsedTime = null;

    this.status = STATUS.PENDING;
  }

  get elapsedTime() {
    if (this.status === STATUS.STARTED) {
      return new Date() - this.startedAt;
    }

    return this._elapsedTime;
  }

  get status() {
    return this._status;
  }

  set status(status) {
    this._status = status;
    if (status === 'STARTED') {
      this._startedAt = new Date();
    }
    if (status === STATUS.SUCCEEDED || status === STATUS.FAILED) {
      this._elapsedTime = new Date() - this.startedAt;
    }
    this.emit('status', status);
  }

  get startedAt() {
    return this._startedAt;
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
          self.status = STATUS.FAILED;
          return reject(err);
        }
        self.status = STATUS.SUCCEEDED;
        resolve();
      });

      self.status = STATUS.STARTED;
      let stream = fs.createWriteStream(
        path.resolve(process.env.COMMAND_LOGS_DIR, self.instanceId + '.log'), {
          encoding: 'utf8',
          flags: 'w'
        }
      );
      self.process.stdout.pipe(stream);
      self.process.stderr.pipe(stream);

      self.process.stdout.on('data', function(data) {
        self.stdout.emit('data', data);
      });

      self.process.stderr.on('data', function(data) {
        self.stderr.emit('data', data);
      });
    });
  }
}
