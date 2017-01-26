/* globals Group, Command, AppError, GroupMemberCommand, GroupMemberGroup,
GroupMember, Util */
import _ from 'lodash';
import url from 'url';
import qs from 'querystring';
import Promise from 'bluebird';
import co from 'co';
import {generate as randString} from 'rand-token';

const DEFAULT_FIELDS_LIST = [
  'name',
  'enabled',
  'executionType',
  'members',
  'queue',
  'createdAt'
];

const normalizeMembers = function(members) {
  return _.map(members, item => {
    let id = item.command || item.group;
    return _.merge(_.pick(item, 'type'), {
      _id: id,
      _uri: url.resolve(this.baseUrl,
        `/${(item.command) ? 'commands' : 'groups'}/` + id)
    });
  });
};

const castMembers = function(members) {
  return _(members).map(item => {
    let member;
    if (item.type === 'command' && item._id) {
      member = new GroupMemberCommand({command: item._id});
    } else if (item.type === 'group' && item._id) {
      member = new GroupMemberGroup({group: item._id});
    }
    return member;
  }).compact().value();
};

const expandGroup = co.wrap(function* (member, fields = ['name', 'members']) {
  if (member.type === 'group') {
    let group = yield Group
      .findOne(member._id)
      .select(_.merge({
        _id: 0
      }, Util.keyArrayToObject(fields)))
      .populate({path: 'members', select: {
        command: 1,
        group: 1,
        type: 1,
        _id: 0
      }})
      .exec();

    if (!group) {
      return null;
    }

    let result = _.merge(_.pick(member, [
      '_id',
      '_uri',
      'type'
    ]), _.pick(group, fields));

    if (result.members) {
      result.members = normalizeMembers.call(this, result.members);

      result.members = yield Promise.map(result.members, member => {
        return expandGroup.call(this, member, fields);
      }, {concurrency: 5});
    }

    return result;
  } else if (member.type === 'command') {
    let command = yield Command
      .findOne(member._id)
      .select(_.merge({
        _id: 0
      }, Util.keyArrayToObject(fields)))
      .exec();

    if (!command) {
      return null;
    }

    return _.merge(_.pick(member, [
      '_id',
      '_uri',
      'type'
    ]), _.pick(command, fields));
  }

  return member;
});

const createMembers = function* (members) {
  members = castMembers(members);
  try {
    yield Promise.map(members, member => member.save(), {concurrency: 4});
  } catch (err) {
    try {
      yield Promise.map(members, member =>
        GroupMember.remove(member).exec(), {concurrency: 4});
    } catch (err) {}
    throw err;
  }

  return members;
};

export let GroupController = {
  create: function* () {
    let members = [];

    if (this.request.body.members instanceof Array) {
      members = yield createMembers(this.request.body.members);
    }

    let params = _.pick(this.request.body, [
      'name',
      'queue',
      'enabled',
      'executionType'
    ]);

    if (_.isUndefined(params.queue)) {
      params.queue = randString(12);
    }

    let group = new Group(_.merge(params, {
      creator: this.user,
      members
    }));
    yield group.save();

    this.body = {
      uri: url.resolve(this.baseUrl, '/groups/' + group._id),
      _id: group._id
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

    let query = [{creator: this.user}];
    let authorizedGroups = _(this.permissions)
      .filter({operation: 'EXECUTE_GROUP'})
      .map('scope')
      .map('group')
      .compact()
      .uniq()
      .value();
    if (authorizedGroups.length > 0) {
      query.push({
        _id: {$in: authorizedGroups}
      });
    }

    let count = yield Group.where().or(query).count();
    if (skip >= count) {
      this.body = {
        links: {},
        data: []
      };
    }

    let groups = yield Group
      .find()
      .or(query)
      .select(Util.keyArrayToObject(fields))
      .populate({path: 'members', select: {
        command: 1,
        group: 1,
        type: 1,
        _id: 0
      }})
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    _.each(groups, item => {
      item.members = normalizeMembers.call(this, item.members);
    });

    if (this.request.query.expand) {
      for (let group of groups) {
        if (group.members) {
          group.members = yield Promise.map(group.members, member => {
            return expandGroup.call(this, member, fields);
          }, {concurrency: 5});
        }
      }
    }

    let links = {
      self: url.resolve(this.baseUrl, '/groups') +
        '?' + qs.stringify({limit, skip}),
      last: url.resolve(this.baseUrl, '/groups') +
        '?' + qs.stringify({
          limit: count % limit,
          skip: Math.floor(count / limit) * limit
        })
    };

    if ((limit + skip) < count) {
      links.next = url.resolve(this.baseUrl, '/groups') +
        '?' + qs.stringify({limit, skip: limit + skip});
    }

    this.body = {
      links,
      data: _.map(groups, item => {
        item._uri = url.resolve(this.baseUrl, '/groups/' + item._id);
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

    let group = yield Group
      .findOne(query)
      .select(_.merge(Util.keyArrayToObject(fields), {_id: 0}))
      .populate({path: 'members', select: {
        command: 1,
        group: 1,
        type: 1,
        _id: 0
      }})
      .lean(true)
      .exec();

    if (!group) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} group does not exist.`);
    }

    if (group.members) {
      group.members = normalizeMembers.call(this, group.members);
    }

    if (this.request.query.expand && group.members) {
      group.members = yield Promise.map(group.members, member => {
        return expandGroup.call(this, member, fields);
      }, {concurrency: 5});
    }

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/groups/' + this.params.id)
      },
      data: group
    };
  },
  update: function* () {
    let group = yield Group
      .findOne({_id: this.params.id, creator: this.user})
      .exec();

    if (!group) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} group does not exist.`);
    }

    let params = _.pick(this.request.body, [
      'name',
      'queue',
      'members',
      'enabled',
      'executionType'
    ]);

    if (params.members instanceof Array) {
      params.members = yield createMembers(params.members);
      yield GroupMember.remove({_id: {$in: group.members}}).exec();
    }

    yield group.update(params).exec();
    this.status = 200;
  },
  remove: function* () {
    let group = yield Group
      .findOne({_id: this.params.id, creator: this.user})
      .exec();

    if (!group) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} group does not exist.`);
    }

    yield group.remove();
    yield GroupMember.remove({_id: {$in: group.members}}).exec();
    this.status = 200;
  }
};
