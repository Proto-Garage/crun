/* globals AppError */
import _ from 'lodash';

export let canCreateUser = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'WRITE_USER', user: 'all'})
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a user.');
  }
  yield next;
};
