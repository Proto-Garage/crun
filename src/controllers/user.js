/* globals User, AppError */
import _ from 'lodash';
import url from 'url';
import qs from 'querystring';

const DEFAULT_FIELDS_LIST = [
  'username',
  'createdAt',
  'roles'
];

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
    let fields = DEFAULT_FIELDS_LIST;
    if (this.query.fields) {
      fields = _.intersection(fields, this.query.fields.split(','));
    }

    let query = {_id: this.params.id};
    query.creator = this.user;

    let user = yield User
      .findOne(query)
      .select(_.merge(Util.keyArrayToObject(fields), {_id: 0}))
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

    let fields = DEFAULT_FIELDS_LIST;
    if (this.query.fields) {
      fields = _.intersection(fields, this.query.fields.split(','));
    }

    let query = {creator: this.user};
    let count = yield User.where(query).count();
    if (skip >= count) {
      this.body = {
        links: {},
        data: []
      };
    }

    let users = yield User
      .find({creator: this.user})
      .select(Util.keyArrayToObject(fields))
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    let links = {
      self: url.resolve(this.baseUrl, '/commands') +
        '?' + qs.stringify({limit, skip}),
      last: url.resolve(this.baseUrl, '/commands') +
        '?' + qs.stringify({
          limit: count % limit,
          skip: Math.floor(count / limit) * limit
        })
    };

    if ((limit + skip) < count) {
      links.next = url.resolve(this.baseUrl, '/commands') +
        '?' + qs.stringify({limit, skip: limit + skip});
    }

    this.body = {
      links,
      data: _.map(users, item => {
        item.uri = url.resolve(this.baseUrl, '/users/' + item._id);
        return item;
      })
    };
  }
};
