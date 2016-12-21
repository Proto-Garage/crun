/* globals AppError */
import _ from 'lodash';

export let canFindSingleGroup = function * (next) {
  let permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .filter({operation: 'READ_GROUP'})
    .filter(item => {
      return item.group === 'all' || item.group === this.params.id;
    })
    .value();

  if (permissions.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot retrieve group ${this.params.id}.`);
  }
  yield next;
};
