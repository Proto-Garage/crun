import {EventEmitter} from 'events';
import co from 'co';
import {v4 as uid} from 'uuid';
import _ from 'lodash';

class Queue extends EventEmitter {
  constructor() {
    super();

    this.tokens = {};
    this.on('release', payload => {
      delete this.tokens[payload.token];
      if (this.isEmpty()) {
        this.emit('empty');
      }
    });
  }

  isEmpty() {
    return _.isEmpty(this.tokens);
  }

  acquireToken() {
    let token = uid();
    return new Promise(resolve => {
      let handler = () => {
        if (this.isEmpty()) {
          this.tokens[token] = true;
          this.removeListener('empty', handler);
          resolve(token);
        }
      };
      this.on('empty', handler);
      handler();
    });
  }

  releaseToken(token) {
    this.emit('release', {token});
  }
}

let queues = {};

export let acquireToken = co.wrap(function* (queue) {
  if (!queues[queue]) {
    queues[queue] = new Queue();
    queues[queue].lastUsed = Date.now();
  }

  return {
    queue,
    token: yield queues[queue].acquireToken()
  };
});

export let releaseToken = function(token) {
  if (queues[token.queue]) {
    queues[token.queue].releaseToken(token.token);
    if (Date.now() - queues[token.queue] > 86400000) {
      delete queues[token.queue];
    } else {
      queues[token.queue].lastUsed = Date.now();
    }
  }
};
