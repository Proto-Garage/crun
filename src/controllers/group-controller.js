/* globals Group, Command, AppError */
import _ from 'lodash';
import url from 'url';
import {isValidGroup, extractCommands} from '../lib/group';
import qs from 'querystring';

export let GroupController = {
  update: function * () {
    let params = _.pick(this.request.body, [
      'name',
      'queue',
      'group',
      'enabled'
    ]);

    let group = yield Group
      .findOneAndUpdate({_id: this.params.id, creator: this.user}, params)
      .exec();

    if (!group) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} group does not exist.`);
    }

    this.status = 200;
  },
  remove: function * () {
    let group = yield Group
      .findOneAndRemove({creator: this.user, _id: this.params.id})
      .exec();

    if (!group) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} group does not exist.`);
    }

    this.status = 200;
  },
  create: function * () {
    let params = _.pick(this.request.body, [
      'name',
      'group',
      'queue',
      'enabled'
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
      uri: url.resolve(this.baseUrl, '/groups/' + group._id),
      _id: group._id
    };
    this.status = 201;
  },
  find: function * () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let groups = yield Group
      .find({creator: this.user})
      .select({name: 1, group: 1, createdAt: 1, queue: 1, enabled: 1})
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/groups') +
          '?' + qs.stringify({limit, skip}),
        next: url.resolve(this.baseUrl, '/groups') +
          '?' + qs.stringify({limit, skip: limit})
      },
      data: _.map(groups, item => {
        item.uri = url.resolve(this.baseUrl, '/groups/' + item._id);
        return item;
      })
    };
  },
  findOne: function * () {
    let group = yield Group
      .findOne({_id: this.params.id, creator: this.user})
      .select({name: 1, group: 1, createdAt: 1, queue: 1, enabled: 1})
      .lean(true)
      .exec();

    if (!group) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} group does not exist.`);
    }

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/groups/' + this.params.id)
      },
      data: group
    };
  }
};
