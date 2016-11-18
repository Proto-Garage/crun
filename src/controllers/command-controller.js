/* globals Command, AppError */
import _ from 'lodash';
import url from 'url';
import qs from 'querystring';

export let CommandController = {
  update: function * () {
    let params = _.pick(this.request.body, [
      'name',
      'command',
      'cwd',
      'timeout',
      'env',
      'enabled'
    ]);

    let command = yield Command
      .findOneAndUpdate({_id: this.params.id, creator: this.user}, params)
      .exec();

    if (!command) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} command does not exist.`);
    }

    this.status = 200;
  },
  remove: function * () {
    let command = yield Command
      .findOneAndRemove({creator: this.user, _id: this.params.id})
      .exec();

    if (!command) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} command does not exist.`);
    }

    this.status = 200;
  },
  create: function * () {
    let params = _.pick(this.request.body, [
      'name',
      'command',
      'env',
      'cwd',
      'timeout',
      'enabled'
    ]);
    params.creator = this.user;

    let command = new Command(params);
    yield command.save();

    this.body = {
      uri: url.resolve(this.baseUrl, '/commands/' + command._id),
      _id: command._id
    };
    this.status = 201;
  },
  find: function * () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let commands = yield Command
      .find({creator: this.user})
      .select({name: 1, command: 1, env: 1, cwd: 1,
        createdAt: 1, timeout: 1, enabled: 1})
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/commands') +
          '?' + qs.stringify({limit, skip}),
        next: url.resolve(this.baseUrl, '/commands') +
          '?' + qs.stringify({limit, skip: limit})
      },
      data: _.map(commands, item => {
        item.uri = url.resolve(this.baseUrl, '/commands/' + item._id);
        return item;
      })
    };
  },
  findOne: function * () {
    let command = yield Command
      .findOne({_id: this.params.id, creator: this.user})
      .select({name: 1, command: 1, env: 1, cwd: 1,
        createdAt: 1, timeout: 1, enabled: 1})
      .lean(true)
      .exec();

    if (!command) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} command does not exist.`);
    }

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/commands/' + this.params.id)
      },
      data: command
    };
  }
};
