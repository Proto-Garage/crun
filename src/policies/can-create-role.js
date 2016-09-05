/* globals AppError */
import _ from 'lodash';

export let canCreateRole = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'WRITE_ROLE', role: 'all'})
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a role.');
  }
  yield next;
};
