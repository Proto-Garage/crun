/* globals AppError */
import _ from 'lodash';

export let canFindCommand = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'READ_COMMAND', command: 'all'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot retrieve commands.');
  }
  yield next;
};
