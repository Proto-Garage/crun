/* globals Group, AppError, GroupMemberCommand, GroupMemberGroup, GroupMember */
import _ from 'lodash';
import url from 'url';
import qs from 'querystring';
import Promise from 'bluebird';

export let GroupController = {
  create: function * () {
    let members = [];

    if (this.request.body.members instanceof Array) {
      for (let item of this.request.body.members) {
        if (item.type === 'command' && item._id) {
          members.push(new GroupMemberCommand({command: item._id}));
        } else if (item.type === 'group' && item._id) {
          members.push(new GroupMemberGroup({group: item._id}));
        }
      }
    }

    let group = new Group(_.merge(_.pick(this.request.body, [
      'name',
      'queue',
      'enabled'
    ]), {
      creator: this.user,
      members
    }));

    try {
      yield Promise.map(members, member => member.save(), {concurrency: 4});
      yield group.save();
    } catch (err) {
      try {
        yield Promise.map(members, member =>
          GroupMember.remove(member).exec(), {concurrency: 4});
      } catch (err) {}
      throw err;
    }

    this.body = {
      uri: url.resolve(this.baseUrl, '/groups/' + group._id),
      _id: group._id
    };
    this.status = 201;
  },
  update: function * () {
    let params = _.pick(this.request.body, [
      'name',
      'queue',
      'group',
      'enabled'
    ]);

    let group = yield Group
      .findOneAndUpdate({_id: this.params.id, creator: this.user}, params)
      .exec();

    if (!group) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} group does not exist.`);
    }

    this.status = 200;
  },
  remove: function * () {
    let group = yield Group
      .findOneAndRemove({creator: this.user, _id: this.params.id})
      .exec();

    if (!group) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} group does not exist.`);
    }

    this.status = 200;
  },
  find: function * () {
    let limit = Number.parseInt(this.query.limit, 10) || 10;
    let skip = Number.parseInt(this.query.skip, 10) || 0;

    let groups = yield Group
      .find({creator: this.user})
      .select({name: 1, group: 1, createdAt: 1, queue: 1, enabled: 1})
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean(true)
      .exec();

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/groups') +
          '?' + qs.stringify({limit, skip}),
        next: url.resolve(this.baseUrl, '/groups') +
          '?' + qs.stringify({limit, skip: limit})
      },
      data: _.map(groups, item => {
        item.uri = url.resolve(this.baseUrl, '/groups/' + item._id);
        return item;
      })
    };
  },
  findOne: function * () {
    let group = yield Group
      .findOne({_id: this.params.id, creator: this.user})
      .select({name: 1, group: 1, createdAt: 1, queue: 1, enabled: 1})
      .lean(true)
      .exec();

    if (!group) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} group does not exist.`);
    }

    this.body = {
      links: {
        self: url.resolve(this.baseUrl, '/groups/' + this.params.id)
      },
      data: group
    };
  }
};
