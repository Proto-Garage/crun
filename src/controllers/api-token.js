/* globals APIToken, Util, AppError */
import url from 'url';
import _ from 'lodash';
import qs from 'querystring';

const DEFAULT_FIELDS_LIST = [
  'creator',
  'owner',
  'token',
  'createdAt'
];

export let APITokenController = {
  create: function * () {
    let token = new APIToken({
      creator: this.user,
      owner: this.params.id || this.user
    });
    yield token.save();

    this.body = {
      uri: url.resolve(this.baseUrl, '/tokens/' + token._id),
      _id: token._id,
      token: token.token
    };
    this.status = 201;
  },
  findOne: function * () {
    let fields = DEFAULT_FIELDS_LIST;
    if (this.query.fields) {
      fields = _.intersection(fields, this.query.fields.split(','));
    }
    let query = {
      $and: [{
        _id: this.params.id
      }, {
        $or: [{
          creator: this.user
        }, {
          owner: this.user
        }]
      }]
    };

    query.creator = this.user;

    let token = yield APIToken
      .findOne(query)
      .select(_.merge(Util.keyArrayToObject(fields), {_id: 0}))
      .lean(true)
      .exec();

    if (!token) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} token does not exist.`);
    }

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/tokens/' + this.params.id)
      },
      data: token
    };
  },
  find: function * () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let fields = DEFAULT_FIELDS_LIST;
    if (this.query.fields) {
      fields = _.intersection(fields, this.query.fields.split(','));
    }

    let query = [{
      creator: this.user
    }, {
      owner: this.user
    }];

    let count = yield APIToken.where().or(query).count();
    if (skip >= count) {
      this.body = {
        links: {},
        data: []
      };
    }

    let groups = yield APIToken
      .find()
      .or(query)
      .select(Util.keyArrayToObject(fields))
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    let links = {
      self: url.resolve(this.baseUrl, '/tokens') +
        '?' + qs.stringify({limit, skip}),
      last: url.resolve(this.baseUrl, '/tokens') +
        '?' + qs.stringify({
          limit: count % limit,
          skip: Math.floor(count / limit) * limit
        })
    };

    if ((limit + skip) < count) {
      links.next = url.resolve(this.baseUrl, '/tokens') +
        '?' + qs.stringify({limit, skip: limit + skip});
    }

    this.body = {
      links,
      data: _.map(groups, item => {
        item._uri = url.resolve(this.baseUrl, '/tokens/' + item._id);
        return item;
      })
    };
  },
  remove: function * () {
    let token = yield APIToken
      .findOne({_id: this.params.id})
      .exec();

    if (!token) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} token does not exist.`);
    }

    if (token.creator.toString() !== this.user._id.toString()) {
      throw new AppError('FORBIDDEN',
        `Cannot delete token ${this.params.id}.`);
    }

    yield token.remove();
    this.status = 200;
  }
};
