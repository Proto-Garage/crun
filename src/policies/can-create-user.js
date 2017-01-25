/* globals AppError */
import _ from 'lodash';

export let canCreateUser = function* (next) {
  let permissions = _(this.permissions)
    .filter({operation: 'CREATE_USER'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a user.');
  }

  yield next;
};
