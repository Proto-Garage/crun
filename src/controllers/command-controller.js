/* globals Command, AppError */
import _ from 'lodash';
import url from 'url';
import mongoose from 'mongoose';
import qs from 'querystring';

let ObjectId = mongoose.Types.ObjectId;

export let CommandController = {
  remove: function * () {
    if (!ObjectId.isValid(this.params.id)) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} command does not exist.`);
    }
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
      'cwd'
    ]);
    params.creator = this.user;

    let command = new Command(params);
    yield command.save();

    this.body = {
      uri: url.resolve(process.env.BASE_URL, '/commands/' + command._id),
      _id: command._id
    };
    this.status = 201;
  },
  find: function * () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let commands = yield Command
      .find({creator: this.user})
      .select({name: 1, command: 1, env: 1, cwd: 1, createdAt: 1})
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    this.body = {
      links: {
        self: url.resolve(process.env.BASE_URL, '/commands'),
        next: url.resolve(process.env.BASE_URL, '/commands') +
          '?' + qs.stringify({limit, skip: limit})
      },
      data: _.map(commands, item => {
        item.uri = url.resolve(process.env.BASE_URL, '/commands/' + item._id);
        return item;
      })
    };
  },
  findOne: function * () {
    if (!ObjectId.isValid(this.params.id)) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} command does not exist.`);
    }
    let command = yield Command
      .findOne({_id: this.params.id, creator: this.user})
      .select({name: 1, command: 1, env: 1, cwd: 1, createdAt: 1})
      .lean(true)
      .exec();

    if (!command) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} command does not exist.`);
    }

    this.body = {
      links: {
        self: url.resolve(process.env.BASE_URL, '/commands/' + this.params.id)
      },
      data: command
    };
  }
};