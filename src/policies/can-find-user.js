/* globals AppError */
import _ from 'lodash';

export let canFindUser = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'READ_USER', user: 'all'})
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot retrieve users.');
  }
  yield next;
};
