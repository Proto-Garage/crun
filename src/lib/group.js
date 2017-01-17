/* globals AppError */
import {EventEmitter} from 'events';
import co from 'co';
import STATUS from './status';
import {acquireToken, releaseToken} from './queue';
import {Group as GroupModel} from '../models/group';
import {Command as CommandModel} from '../models/command';
import Command from './command';
import Promise from 'bluebird';
import {generate as randString} from 'rand-token';
import _ from 'lodash';

export default class Group extends EventEmitter {
  /**
   * Create group object
   * @param {object} options
   * @param {ObjectId} options.groupId
   * @param {string} options.name
   * @param {string} options.executionType
   * @param {object[]} options.members
   * @param {string} options.queue
   */
  constructor(options) {
    super();

    this.groupId = options.groupId;
    this.name = options.name;
    this.executionType = options.executionType || 'series';
    this.members = options.members || [];
    this.queue = options.queue || randString(12);
    this._startedAt = null;
    this._elapsedTime = null;

    this.status = STATUS.PENDING;
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

  get status() {
    return this._status;
  }

  get startedAt() {
    return this._startedAt;
  }

  get elapsedTime() {
    if (this.status === STATUS.STARTED) {
      return new Date() - this.startedAt;
    }

    return this._elapsedTime;
  }

  * run() {
    this.status = STATUS.QUEUED;
    let token = yield acquireToken(this.queue);

    this.status = STATUS.STARTED;
    try {
      if (this.executionType === 'parallel') {
        yield Promise.map(this.members, co.wrap(function * (member) {
          yield member.run();
        }));
      } else if (this.executionType === 'series') {
        for (let member of this.members) {
          yield member.run();
        }
      }
      this.status = STATUS.SUCCEEDED;
    } catch (err) {
      this.status = STATUS.FAILED;
      throw err;
    } finally {
      releaseToken(token);
    }
  }
}

/**
 * Build group object
 * @param {object} params
 * @param {string} params.type
 * @param {ObjectId} [params.command]
 * @param {objectId} [params.group]
 */
let _buildGroup = function * (params) {
  if (params.type === 'command') {
    let command = yield CommandModel
      .findById(params.command)
      .exec();

    if (!command) {
      throw new AppError('INVALID_REQUEST',
        `${params.command} command does not exist.`);
    }

    return new Command({
      commandId: command._id,
      name: command.name,
      cwd: command.cwd,
      env: command.env,
      command: command.command,
      timeout: command.timeout
    });
  } else if (params.type === 'group') {
    let group = yield GroupModel
      .findById(params.group)
      .populate({path: 'members', select: {
        command: 1,
        group: 1,
        type: 1,
        _id: 0
      }})
      .exec();

    if (!group) {
      throw new AppError('INVALID_REQUEST',
        `${params.group} group does not exist.`);
    }

    let members = yield Promise.map(group.members, co.wrap(_buildGroup));

    return new Group({
      groupId: group._id,
      name: group.name,
      executionType: group.executionType,
      queue: group.queue,
      members
    });
  }
};

/**
 * Build group object
 * @param {ObjectId} groupId
 */
export let buildGroup = function * (groupId) {
  let group = yield _buildGroup({
    group: groupId,
    type: 'group'
  });

  return group;
};

/**
 * Extract status
 */
export let extractStatus = function(group) {
  let status = {
    status: group.status,
    startedAt: group.startedAt,
    elapsedTime: group.elapsedTime
  };
  if (group instanceof Command) {
    status._id = group.commandId;
    status.type = 'command';
  } else if (group instanceof Group) {
    status._id = group.groupId;
    status.type = 'group';
    status.members = _.map(group.members, member => {
      return extractStatus(member);
    });
  }

  return status;
};
