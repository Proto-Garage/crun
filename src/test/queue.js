import {expect} from 'chai';
import {acquireToken, releaseToken} from '../lib/queue';
import rand from 'rand-token';

describe('Queue', function() {
  this.timeout(20000);

  describe('Given an empty queue', function() {
    it('should be able to acquire token', function* () {
      const QUEUE = 'queue ' + rand.generate(8);
      let token = yield acquireToken(QUEUE);
      expect(token).to.has.property('queue', QUEUE);
      expect(token).to.has.property('token');
      releaseToken(token);
    });
  });

  describe('Given a non-empty queue', function() {
    it('should queue next acquisition of token', function* () {
      const QUEUE = 'queue ' + rand.generate(8);

      let timestamp = Date.now();
      let token = yield acquireToken(QUEUE);
      setTimeout(() => {
        releaseToken(token);
      }, 1000);
      token = yield acquireToken(QUEUE);
      setTimeout(() => {
        releaseToken(token);
      }, 2000);
      expect(Date.now() - timestamp).to.above(1000);
      expect(Date.now() - timestamp).to.below(1500);

      yield acquireToken(QUEUE);
      expect(Date.now() - timestamp).to.above(3000);
      expect(Date.now() - timestamp).to.below(3500);
    });
  });
});
