/* globals AppError */
import _ from 'lodash';

export let canRemoveCommand = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'WRITE_COMMAND'})
    .filter(item => {
      return item.command === 'all' || item.command === this.params.id;
    })
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot remove command ${this.params.id}.`);
  }
  yield next;
};
