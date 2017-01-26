/* globals AppError */
import _ from 'lodash';

export let canExecuteGroup = function* (next) {
  let permissions = _(this.permissions)
    .filter({operation: 'EXECUTE_GROUP'})
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot execute group ${this.params.id}.`);
  }

  yield next;
};
