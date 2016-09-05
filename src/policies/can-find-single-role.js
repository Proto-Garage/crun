/* globals AppError */
import _ from 'lodash';

export let canFindSingleRole = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'READ_ROLE'})
    .filter(item => {
      return item.role === 'all' || item.role === this.params.id;
    })
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot retrieve role ${this.params.id}.`);
  }
  yield next;
};
