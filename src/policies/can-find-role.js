/* globals AppError */
import _ from 'lodash';

export let canFindRole = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'READ_ROLE', role: 'all'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot retrieve roles.');
  }
  yield next;
};
