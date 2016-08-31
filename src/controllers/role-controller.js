/* globals Role, AppError */
import _ from 'lodash';
import url from 'url';
import operations from '../lib/operations';

export let RoleController = {
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

    let role = new Role(_.merge(params, {
      creator: this.user
    }));
    yield role.save();
    this.status = 201;
  },
  find: function * () {
    let roles = yield Role
      .find({creator: this.user})
      .select({'operations.name': 1, name: 1, _id: 0}) // eslint-disable-line quote-props
      .exec();

    this.body = {
      links: {
        self: url.resolve(process.env.BASE_URL, '/roles')
      },
      data: roles
    };
  }
};
