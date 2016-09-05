/* globals AppError */
import _ from 'lodash';

export let canFindCommand = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'READ_COMMAND', command: 'all'})
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot retrieve commands.');
  }
  yield next;
};
