/* globals User, AppError */
import _ from 'lodash';
import url from 'url';
import qs from 'querystring';

export let UserController = {
  update: function* () {
    let params = _.pick(this.request.body, ['roles']);

    let user = yield User.findByIdAndUpdate(this.params.id, params).exec();
    if (!user) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} user does not exist.`);
    }
    this.status = 200;
  },
  remove: function* () {
    let user = yield User
      .findOneAndRemove({creator: this.user, _id: this.params.id})
      .exec();

    if (!user) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} user does not exist.`);
    }

    this.status = 200;
  },
  create: function* () {
    let params = _.pick(this.request.body, [
      'username',
      'password',
      'roles'
    ]);

    params.creator = this.user;

    let user = new User(params);
    yield user.save();

    this.body = {
      uri: url.resolve(this.baseUrl, '/users/' + user._id),
      _id: user._id
    };

    this.status = 201;
  },
  findOne: function* () {
    let user = yield User
      .findOne({_id: this.params.id, creator: this.user})
      .select({username: 1, createdAt: 1, roles: 1})
      .lean(true)
      .exec();

    if (!user) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} user does not exist.`);
    }

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/users/' + this.params.id)
      },
      data: user
    };
  },
  find: function* () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let users = yield User
      .find({creator: this.user})
      .select({username: 1, createdAt: 1, roles: 1})
      .populate('roles')
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/users') +
          '?' + qs.stringify({limit, skip}),
        next: url.resolve(this.baseUrl, '/users') +
          '?' + qs.stringify({limit, skip: limit})
      },
      data: _.map(users, item => {
        item.uri = url.resolve(this.baseUrl, '/users/' + item._id);
        return item;
      })
    };
  }
};
