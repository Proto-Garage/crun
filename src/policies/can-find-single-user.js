/* globals AppError */
import _ from 'lodash';

export let canFindSingleUser = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'READ_USER'})
    .filter(item => {
      return item.user === 'all' || item.user === this.params.id;
    })
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot retrieve user ${this.params.id}.`);
  }
  yield next;
};
