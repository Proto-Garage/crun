import _ from 'lodash';
import mongoose from 'mongoose';
import url from 'url';

export default class Group {

  /**
   * Create command group object
   * @param {object}  options
   * @param {string}  options.type
   * @param {Command} options.command
   * @param {Group[]} options.groups
   */
  constructor(options) {
    if (!_.includes(['command', 'serial', 'parallel'], options.type)) {
      throw new Error(`${options.type} is not supported.`);
    }
    this.options = options;
    this.status = 'PENDING';
  }

  toStatusObject() {
    let toStatusObject = function(group) {
      if (group.options.type === 'command') {
        let obj = _.merge({},
          _.pick(group.options, ['_id', 'type']),
          _.pick(group, [
            'status',
            'startedAt',
            'elapsedTime'
          ]));

        if (obj.status === 'STARTED') {
          obj.elapsedTime = Date.now() - obj.startedAt;
        }

        if (obj.status !== 'PENDING') {
          obj.log = url.resolve(
            process.env.BASE_URL, '/logs/' + group.options.command.instanceId
          );
        }
        return obj;
      }
      let obj = _.merge({},
        _.pick(group.options, ['type']),
        _.pick(group, ['status', 'startedAt', 'elapsedTime']));

      if (obj.status === 'STARTED') {
        obj.elapsedTime = Date.now() - obj.startedAt;
      }
      obj.groups = _.map(group.options.groups, toStatusObject);
      return obj;
    };

    return toStatusObject(this);
  }

  * run() {
    this.status = 'STARTED';
    this.startedAt = Date.now();

    if (this.options.type === 'command') {
      this.options.command.on('status', status => {
        if (status === 'SUCCEEDED' || status === 'FAILED') {
          this.elapsedTime = Date.now() - this.startedAt;
        }
        this.status = status;
      });

      yield this.options.command.run();
    } else if (this.options.type === 'serial') {
      try {
        for (let group of this.options.groups) {
          yield group.run();
        }
      } catch (err) {
        this.elapsedTime = Date.now() - this.startedAt;
        this.status = 'FAILED';
        throw err;
      }
      this.status = 'SUCCEEDED';
    } else if (this.options.type === 'parallel') {
      let errors = [];
      yield _.map(this.options.groups, group => {
        return function * () {
          try {
            yield group.run();
          } catch (err) {
            errors.push(err);
          }
        };
      });

      if (errors.length > 0) {
        this.elapsedTime = Date.now() - this.startedAt;
        this.status = 'FAILED';
        throw errors;
      }

      this.elapsedTime = Date.now() - this.startedAt;
      this.status = 'SUCCEEDED';
    } else {
      throw new Error(`${this.options.type} is not supported.`);
    }
  }
}

/**
 * Check if object is a valid execution group
 */
export function isValidGroup(group) {
  if (!group.type) {
    throw new Error('`type` is undefined');
  }
  if (!_.includes(['serial', 'parallel', 'command'], group.type)) {
    throw new Error(`\`${group.type}\` is not a valid type`);
  }
  if (group.type === 'command') {
    if (!group._id) {
      throw new Error('`_id` is undefined');
    }
    if (!mongoose.Types.ObjectId.isValid(group._id)) {
      throw new Error(`\`${group._id}\` is not a valid ObjectId`);
    }
  } else {
    if (!group.groups) {
      throw new Error('`groups` is undefined');
    }
    if (!_.isArray(group.groups)) {
      throw new Error('`groups` should be an array');
    }
    _.each(group.groups, item => {
      isValidGroup(item);
    });
  }
}

/**
 * Extract command ids
 */
export function extractCommands(group) {
  if (group.type === 'command') {
    return [group._id];
  }

  let accum = [];
  for (let g of group.groups) {
    accum = accum.concat(extractCommands(g));
  }
  return accum;
}
