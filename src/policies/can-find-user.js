/* globals AppError */
import _ from 'lodash';

export let canFindUser = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'READ_USER', user: 'all'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot retrieve users.');
  }
  yield next;
};
