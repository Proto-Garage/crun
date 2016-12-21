/* globals AppError */
import _ from 'lodash';

export let canUpdateUser = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'WRITE_USER'})
    .filter(item => {
      return item.user === 'all' || item.user === this.params.id;
    })
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot update user ${this.params.id}.`);
  }
  yield next;
};
