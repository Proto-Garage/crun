/* globals AppError */
import _ from 'lodash';

export let canUpdateCommand = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'WRITE_COMMAND'})
    .filter(item => {
      return item.command === 'all' || item.command === this.params.id;
    })
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot update command ${this.params.id}.`);
  }
  yield next;
};
