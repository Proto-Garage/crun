/* globals Group, Command, Execution, AppError */
import _ from 'lodash';
import url from 'url';
import qs from 'querystring';
import CommandObject from '../lib/command';
import {default as GroupObject, extractCommands} from '../lib/group';

import mongoose from 'mongoose';

let executions = {};

let ObjectId = mongoose.Types.ObjectId;

export let ExecutionController = {
  create: function * () {
    let params = _.pick(this.request.body, [
      'group',
      'queue'
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

    this.body = {
      uri: url.resolve(process.env.BASE_URL, '/executions/' + execution._id),
      _id: execution._id
    };
    this.status = 201;
  },
  findOne: function * () {
  }
};
