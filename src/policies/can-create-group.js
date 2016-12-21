/* globals AppError */
import _ from 'lodash';

export let canCreateGroup = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'WRITE_GROUP', group: 'all'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a group.');
  }
  yield next;
};
