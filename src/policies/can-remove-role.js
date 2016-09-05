/* globals AppError */
import _ from 'lodash';

export let canRemoveRole = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'WRITE_ROLE'})
    .filter(item => {
      return item.role === 'all' || item.role === this.params.id;
    })
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot remove role ${this.params.id}.`);
  }
  yield next;
};
