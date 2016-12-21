/* globals AppError */
import _ from 'lodash';

export let canFindSingleRole = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'READ_ROLE'})
    .filter(item => {
      return item.role === 'all' || item.role === this.params.id;
    })
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot retrieve role ${this.params.id}.`);
  }
  yield next;
};
