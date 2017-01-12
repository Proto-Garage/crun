import {EventEmitter} from 'events';
import _ from 'lodash';
import co from 'co';
import STATUS from './status';

export default class Group extends EventEmitter {
  /**
   * Create group object
   * @param {object} options
   * @param {string} options.name
   * @param {string} options.executionType
   * @param {object[]} options.members
   * @param {string} options.queue
   */
  constructor(options) {
    super();

    this.name = options.name;
    this.executionType = options.executionType || 'series';
    this.members = options.members || [];
    this.queue = options.queue;

    this.setStatus(STATUS.PENDING);
  }

  setStatus(status) {
    this.status = status;
    this.emit('status', status);
  }

  * runMember(member) {
    member.on('status', status => {
      if (status === 'SUCCEEDED' || status === 'FAILED') {
        this.elapsedTime = Date.now() - this.startedAt;
      }
      this.status = status;
    });

    yield member.run();
  }

  * run() {
    this.startedAt = Date.now();

    this.setStatus(STATUS.STARTED);
    if (this.executionType === 'parallel') {
      try {
        yield _.map(this.members, co.wrap(this.runMember));
        this.setStatus(STATUS.SUCCEEDED);
      } catch (err) {
        this.setStatus(STATUS.FAILED);
        throw err;
      }
    } else if (this.executionType === 'series') {
      try {
        for (let member of this.members) {
          yield this.runMember(member);
        }
        this.setStatus(STATUS.SUCCEEDED);
      } catch (err) {
        this.setStatus(STATUS.FAILED);
        throw err;
      }
    }
  }
}
