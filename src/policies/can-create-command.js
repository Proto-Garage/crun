/* globals AppError */
import _ from 'lodash';

export let canCreateCommand = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'WRITE_COMMAND', command: 'all'})
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a command.');
  }
  yield next;
};
