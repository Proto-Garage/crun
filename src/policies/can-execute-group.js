/* globals AppError */
import _ from 'lodash';

export let canExecuteGroup = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'EXECUTE_GROUP'})
    .filter(item => {
      return item.group === 'all' || item.group === this.request.body.group;
    })
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot execute group ${this.params.id}.`);
  }
  yield next;
};
