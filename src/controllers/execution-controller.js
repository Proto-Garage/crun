/* globals Group, Command, Execution, AppError */
import _ from 'lodash';
import url from 'url';
import qs from 'querystring';
import CommandObject from '../lib/command';
import {default as GroupObject, extractCommands} from '../lib/group';
import co from 'co';

import mongoose from 'mongoose';

let executions = {};
let queues = {};

let ObjectId = mongoose.Types.ObjectId;

export let ExecutionController = {
  create: function * () {
    let params = _.pick(this.request.body, [
      'group'
    ]);
    params.creator = this.user;

    if (!ObjectId.isValid(params.group)) {
      throw new AppError('INVALID_REQUEST',
        `${params.group} is not a valid ObjectId.`);
    }
    let group = yield Group
      .findById(params.group)
      .exec();

    if (!group) {
      throw new AppError('INVALID_REQUEST',
        `${params.group} does not exist.`);
    }

    let queue = group.queue;
    group = group.group;

    let commandsList = extractCommands(group);
    let commands = {};
    yield _.map(commandsList, id => {
      return function * () {
        let command = yield Command
          .findById(id)
          .select({name: 1, command: 1, env: 1, cwd: 1})
          .lean(true)
          .exec();

        if (!command) {
          throw new AppError('INVALID_REQUEST',
            `${id} command does not exist.`);
        }
        command.status =
        commands[id] = command;
      };
    });

    let convert = function(group) {
      if (group.type === 'command') {
        group.command = new CommandObject(commands[group._id]);
        return new GroupObject(group);
      }
      group.groups = _.map(group.groups, item => {
        return convert(item);
      });

      return new GroupObject(group);
    };

    group = convert(group);

    let execution = new Execution(params);
    yield execution.save();

    let executionId = execution._id.toHexString();
    executions[executionId] = group;

    this.body = {
      uri: url.resolve(process.env.BASE_URL, '/executions/' + execution._id),
      _id: executionId
    };
    this.status = 201;

    if (queues[queue]) {
      queues[queue].push(executionId);
    } else {
      queues[queue] = [executionId];
      co(function * () {
        while (queues[queue].length > 0) {
          let executionId = _.first(queues[queue]);
          try {
            yield executions[executionId].run();
          } catch (err) {
            console.error(err);
          }
          yield Execution
            .update({_id: executionId},
              {status: executions[executionId].toStatusObject()})
            .exec();
          queues[queue].shift();
          delete executions[executionId];
        }
        delete queues[queue];
      });
    }
  },
  findOne: function * () {
    let execution = yield Execution
      .findOne({_id: this.params.id, creator: this.user})
      .select({createdAt: 1, group: 1, status: 1})
      .lean(true)
      .exec();

    if (!execution) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} execution does not exist.`);
    }

    if (executions[execution._id]) {
      execution.status = executions[execution._id].toStatusObject();
    }

    this.body = {
      links: {
        self: url.resolve(process.env.BASE_URL, '/execution/' + this.params.id)
      },
      data: execution
    };
  },
  find: function * () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let data = yield Execution
      .find({creator: this.user})
      .select({createdAt: 1, group: 1, status: 1})
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    _.each(data, item => {
      if (executions[item._id]) {
        item.status = executions[item._id].toStatusObject();
      }
    });

    this.body = {
      links: {
        self: url.resolve(process.env.BASE_URL, '/executions') +
          '?' + qs.stringify({limit, skip}),
        next: url.resolve(process.env.BASE_URL, '/executions') +
          '?' + qs.stringify({limit, skip: limit})
      },
      data: _.map(data, item => {
        item.uri = url.resolve(process.env.BASE_URL, '/executions/' + item._id);
        return item;
      })
    };
  }
};
