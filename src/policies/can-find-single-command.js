/* globals AppError */
import _ from 'lodash';

export let canFindSingleCommand = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'READ_COMMAND'})
    .filter(item => {
      return item.command === 'all' || item.command === this.params.id;
    })
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN',
      `Cannot retrieve command ${this.params.id}.`);
  }
  yield next;
};
