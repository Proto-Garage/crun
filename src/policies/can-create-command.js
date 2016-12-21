/* globals AppError */
import _ from 'lodash';

export let canCreateCommand = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'WRITE_COMMAND', command: 'all'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a command.');
  }
  yield next;
};
