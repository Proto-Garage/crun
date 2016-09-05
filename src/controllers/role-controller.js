/* globals Role, AppError */
import _ from 'lodash';
import url from 'url';
import operations from '../lib/operations';
import qs from 'querystring';

export let RoleController = {
  remove: function * () {
    let role = yield Role
      .findOneAndRemove({creator: this.user, _id: this.params.id})
      .exec();

    if (!role) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} role does not exist.`);
    }

    this.status = 200;
  },
  create: function * () {
    let params = _.pick(this.request.body, [
      'name',
      'operations'
    ]);

    let diff = _(params.operations).map('name').difference(operations).value();

    if (diff.length > 0) {
      throw new AppError('INVALID_ROLE_OPERATION',
        `${_.first(diff)} is invalid.`);
    }

    params.creator = this.user;

    let role = new Role(params);
    yield role.save();

    this.body = {
      uri: url.resolve(process.env.BASE_URL, '/roles/' + role._id),
      _id: role._id
    };
    this.status = 201;
  },
  findOne: function * () {
    let role = yield Role
      .findOne({_id: this.params.id, creator: this.user})
      .select({
        'name': 1,
        'operations.name': 1,
        'operations.params': 1
      })
      .lean(true)
      .exec();

    if (!role) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} role does not exist.`);
    }

    this.body = {
      links: {
        self: url.resolve(process.env.BASE_URL, '/roles/' + this.params.id)
      },
      data: role
    };
  },
  find: function * () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let roles = yield Role
      .find({creator: this.user})
      .select({
        'name': 1,
        'operations.name': 1,
        'operations.params': 1
      })
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    this.body = {
      links: {
        self: url.resolve(process.env.BASE_URL, '/roles') +
          '?' + qs.stringify({limit, skip}),
        next: url.resolve(process.env.BASE_URL, '/roles') +
          '?' + qs.stringify({limit, skip: limit})
      },
      data: _.map(roles, item => {
        item.uri = url.resolve(process.env.BASE_URL, '/roles/' + item._id);
        return item;
      })
    };
  }
};
