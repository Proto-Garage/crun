/* globals AppError */
import _ from 'lodash';

export let canFindRole = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'READ_ROLE', role: 'all'})
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot retrieve roles.');
  }
  yield next;
};
