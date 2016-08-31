/* globals Command, AppError */
import _ from 'lodash';
import url from 'url';
import mongoose from 'mongoose';

let ObjectId = mongoose.Types.ObjectId;

export let CommandController = {
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
      uri: url.resolve(process.env.BASE_URL, '/commands/' + command._id)
    };
    this.status = 201;
  },
  find: function * () {
    let commands = yield Command
      .find({creator: this.user})
      .select({name: 1, command: 1, env: 1, cwd: 1, _id: 0, createdAt: 1})
      .sort({createdAt: -1})
      .exec();

    this.body = {
      links: {
        self: url.resolve(process.env.BASE_URL, '/commands')
      },
      data: commands
    };
  },
  findOne: function * () {
    if (!ObjectId.isValid(this.params.id)) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} command does not exist.`);
    }
    let command = yield Command
      .findOne({_id: this.params.id, creator: this.user})
      .select({name: 1, command: 1, env: 1, cwd: 1, _id: 0, createdAt: 1})
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
