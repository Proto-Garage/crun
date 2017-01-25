/* globals Command, AppError */
import _ from 'lodash';
import url from 'url';
import qs from 'querystring';

const DEFAULT_FIELDS_LIST = [
  'name',
  'command',
  'env',
  'cwd',
  'createdAt',
  'timeout',
  'enabled'
];

export let CommandController = {
  update: function* () {
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
  remove: function* () {
    let command = yield Command
      .findOneAndRemove({creator: this.user, _id: this.params.id})
      .exec();

    if (!command) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} command does not exist.`);
    }

    this.status = 200;
  },
  create: function* () {
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
  find: function* () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let fields = DEFAULT_FIELDS_LIST;
    if (this.query.fields) {
      fields = _.intersection(fields, this.query.fields.split(','));
    }

    let query = {creator: this.user};
    let count = yield Group.where(query).count();
    if (skip >= count) {
      this.body = {
        links: {},
        data: []
      };
    }

    let commands = yield Command
      .find(query)
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
      data: _.map(commands, item => {
        item.uri = url.resolve(this.baseUrl, '/commands/' + item._id);
        return item;
      })
    };
  },
  findOne: function* () {
    let fields = DEFAULT_FIELDS_LIST;
    if (this.query.fields) {
      fields = _.intersection(fields, this.query.fields.split(','));
    }

    let query = {_id: this.params.id};
    query.creator = this.user;

    let command = yield Command
      .findOne(query)
      .select(_.merge(Util.keyArrayToObject(fields), {_id: 0}))
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
