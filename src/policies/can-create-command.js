/* globals AppError */
import _ from 'lodash';

export let canCreateCommand = function* (next) {
  let permissions = _(this.permissions)
    .filter({operation: 'CREATE_COMMAND'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a command.');
  }
  yield next;
};
