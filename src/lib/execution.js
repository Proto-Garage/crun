import _ from 'lodash';
import {EventEmitter} from 'events';

export default class Execution extends EventEmitter {

  /**
   * Create execution object
   * @param {object} params
   * @param {group} params.group
   */
  constructor(group) {
    super();
    this.group = group;
    this.status = 'PENDING';
  }

  * run() {
    this.status = 'STARTED';
    this.emit('status', this.status);

    let execute = function * (group) {
      if (group.type === 'command') {
        yield group.command.run();
      } else if (group.type === 'serial') {
        for (let group of group.groups) {
          yield execute(group);
        }
      } else if (group.type === 'parallel') {
        let error = [];
        yield _.map(group.groups, group => {
          return function * () {
            try {
              yield execute(group);
            } catch (err) {
              error.push(err);
            }
          };
        });
      } else {
        throw new Error(`${group.type} is not supported.`);
      }
    };

    yield execute(this.group);
  }
}
