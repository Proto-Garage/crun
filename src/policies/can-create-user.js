/* globals AppError */
import _ from 'lodash';

export let canCreateUser = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'WRITE_USER', user: 'all'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a user.');
  }
  yield next;
};
