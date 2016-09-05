/* globals AppError */
import _ from 'lodash';

export let canFindSingleGroup = function * (next) {
  let operations = _(this.user.roles)
    .map('operations')
    .flatten()
    .filter({name: 'READ_GROUP'})
    .filter(item => {
      return item.group === 'all' || item.group === this.params.id;
    })
    .value();

  if (operations.length === 0) {
    throw new AppError('FORBIDDEN', `Cannot retrieve group ${this.params.id}.`);
  }
  yield next;
};
