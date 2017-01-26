/* globals Role, AppError, Util */
import _ from 'lodash';
import url from 'url';
import operations from '../lib/operations';
import qs from 'querystring';

const DEFAULT_FIELDS_LIST = [
  'name',
  'createdAt',
  'permissions'
];

export let RoleController = {
  create: function* () {
    let params = _.pick(this.request.body, [
      'name',
      'permissions'
    ]);

    let diff = _(params.permissions)
      .map('operation')
      .difference(operations)
      .value();

    if (diff.length > 0) {
      throw new AppError('INVALID_ROLE_OPERATION',
        `${_.first(diff)} is invalid.`);
    }

    params.creator = this.user;

    let role = new Role(params);
    yield role.save();

    this.body = {
      uri: url.resolve(this.baseUrl, '/roles/' + role._id),
      _id: role._id
    };
    this.status = 201;
  },
  update: function* () {
    let params = _.pick(this.request.body, [
      'name',
      'permissions'
    ]);

    let role = yield Role
      .findOneAndUpdate({_id: this.params.id, creator: this.user}, params)
      .exec();

    if (!role) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} role does not exist.`);
    }

    this.status = 200;
  },
  findOne: function* () {
    let fields = DEFAULT_FIELDS_LIST;
    if (this.query.fields) {
      fields = _.intersection(fields, this.query.fields.split(','));
    }

    let role = yield Role
      .findOne({_id: this.params.id, creator: this.user})
      .select(_.merge(Util.keyArrayToObject(fields), {_id: 0}))
      .lean(true)
      .exec();

    if (!role) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} role does not exist.`);
    }

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/roles/' + this.params.id)
      },
      data: role
    };
  },
  find: function* () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let fields = DEFAULT_FIELDS_LIST;
    if (this.query.fields) {
      fields = _.intersection(fields, this.query.fields.split(','));
    }

    let query = {creator: this.user};
    let count = yield Role.where(query).count();
    if (skip >= count) {
      this.body = {
        links: {},
        data: []
      };
    }

    let roles = yield Role
      .find(query)
      .select(Util.keyArrayToObject(fields))
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    let links = {
      self: url.resolve(this.baseUrl, '/roles') +
        '?' + qs.stringify({limit, skip}),
      last: url.resolve(this.baseUrl, '/roles') +
        '?' + qs.stringify({
          limit: count % limit,
          skip: Math.floor(count / limit) * limit
        })
    };

    if ((limit + skip) < count) {
      links.next = url.resolve(this.baseUrl, '/roles') +
        '?' + qs.stringify({limit, skip: limit + skip});
    }

    this.body = {
      links,
      data: _.map(roles, role => {
        role.uri = url.resolve(this.baseUrl, '/roles/' + role._id);
        return role;
      })
    };
  },
  remove: function* () {
    let role = yield Role
      .findOneAndRemove({creator: this.user, _id: this.params.id})
      .exec();

    if (!role) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} role does not exist.`);
    }

    this.status = 200;
  }
};
