/* globals AppError */
import _ from 'lodash';

export let canCreateGroup = function* (next) {
  let permissions = _(this.permissions)
    .filter({operation: 'CREATE_GROUP'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a group.');
  }
  yield next;
};
