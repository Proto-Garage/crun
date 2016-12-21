/* globals AppError */
import _ from 'lodash';

export let canExecuteGroup = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'EXECUTE_GROUP'})
    .filter(item => {
      return item.group === 'all' || item.group === this.request.body.group;
    })
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot execute group ${this.params.id}.`);
  }
  yield next;
};
