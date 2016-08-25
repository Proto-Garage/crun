/* globals CRUN */

let request = require('supertest')(CRUN.server);

describe('CRUN API Test', function() {
  before(function * () {
    yield CRUN.started;
  });
  after(function * () {
    CRUN.server.close();
  });
  describe('/', function() {
    it('should return 200', function * () {
      request
        .get('/')
        .expect(200)
        .end();
    });
  });
});
