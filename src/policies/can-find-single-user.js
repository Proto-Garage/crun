/* globals AppError */
import _ from 'lodash';

export let canFindSingleUser = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'READ_USER'})
    .filter(item => {
      return item.user === 'all' || item.user === this.params.id;
    })
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot retrieve user ${this.params.id}.`);
  }
  yield next;
};
