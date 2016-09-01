/* globals Group, Command, AppError */
import _ from 'lodash';
import url from 'url';
import {isValidGroup, extractCommands} from '../lib/group';

export let GroupController = {
  remove: function * () {
  },
  create: function * () {
    let params = _.pick(this.request.body, [
      'name',
      'group'
    ]);
    params.creator = this.user;

    try {
      isValidGroup(params.group);
    } catch (err) {
      throw new AppError('INVALID_REQUEST', err.message);
    }

    let commands = _.uniq(extractCommands(params.group));

    yield _.map(commands, id => {
      return function * () {
        let command = yield Command.findById(id).exec();
        if (!command) {
          throw new AppError('INVALID_REQUEST', `${id} command does not exist`);
        }
      };
    });

    let group = new Group(params);
    yield group.save();

    this.body = {
      uri: url.resolve(process.env.BASE_URL, '/groups/' + group._id),
      _id: group._id
    };
    this.status = 201;
  },
  find: function * () {
  },
  findOne: function * () {
  }
};
