/* globals AppError */
import _ from 'lodash';

export let canFindGroup = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'READ_GROUP', group: 'all'})
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot retrieve groups.');
  }
  yield next;
};
