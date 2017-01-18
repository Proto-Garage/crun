/* globals AppError */
import _ from 'lodash';

export let canFindUser = function * (next) {
  let permissions = _(this.permissions)
    .filter({operation: 'READ_USER'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot retrieve users.');
  }

  yield next;
};
