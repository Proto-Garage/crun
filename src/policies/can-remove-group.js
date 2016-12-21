/* globals AppError */
import _ from 'lodash';

export let canRemoveGroup = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'WRITE_GROUP'})
    .filter(item => {
      return item.group === 'all' || item.group === this.params.id;
    })
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot remove group ${this.params.id}.`);
  }
  yield next;
};
