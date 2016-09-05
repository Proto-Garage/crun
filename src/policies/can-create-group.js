/* globals AppError */
import _ from 'lodash';

export let canCreateGroup = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'WRITE_GROUP', group: 'all'})
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', 'Cannot create a group.');
  }
  yield next;
};
