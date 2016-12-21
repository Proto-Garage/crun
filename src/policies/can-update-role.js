/* globals AppError */
import _ from 'lodash';

export let canUpdateRole = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'WRITE_ROLE'})
    .filter(item => {
      return item.role === 'all' || item.role === this.params.id;
    })
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot update role ${this.params.id}.`);
  }
  yield next;
};
