/* globals AppError */
import _ from 'lodash';

export let canUpdateUser = function * (next) {
  let permissions = _(this.permissions)
    .filter({operation: 'UPDATE_USER'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot update user ${this.params.id}.`);
  }
  yield next;
};
