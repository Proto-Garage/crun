/* globals AppError */
import _ from 'lodash';

export let canRemoveGroup = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'WRITE_GROUP'})
    .filter(item => {
      return item.group === 'all' || item.group === this.params.id;
    })
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot remove group ${this.params.id}.`);
  }
  yield next;
};
