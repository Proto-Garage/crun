/* globals app, User */

let request;

describe('CRUN API', function() {
  let userInfo = {
    username: 'roger',
    password: '123456Seven'
  };

  before(function * () {
    yield app.started;

    let user = new User(userInfo);
    yield user.save();

    request = require('supertest')(app.server);
  });

  after(function * () {
    app.server.close();
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
