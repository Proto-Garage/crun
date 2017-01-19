/* globals AppError */
import _ from 'lodash';

export let canCreateRole = function * (next) {
  let permissions = _(this.permissions)
    .filter({operation: 'CREATE_ROLE'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a role.');
  }
  yield next;
};
