/* globals app, User */
/* eslint max-nested-callbacks: ["error", 6]*/
import {expect} from 'chai';
import rand from 'rand-token';

let request;

describe('CRUN API', function() {
  this.timeout(20000);

  let admin = {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
  };

  before(function * () {
    yield app.started;
    request = require('supertest')(app.server);
  });

  after(function * () {
    app.server.close();
  });

  describe('/', function() {
    it('should return 200', function * () {
      yield request
        .get('/')
        .expect(200);
    });
  });

  describe('Authentication (POST)', function() {
    let user;

    before(function * () {
      user = new User({
        username: 'test_user_' + rand.generate(8),
        password: rand.generate(26)
      });
      yield user.save();
    });

    after(function * () {
      yield User.remove(user);
    });

    describe('Given valid credentials', function() {
      it('should return access token and refresh token', function * () {
        yield request
          .post('/authenticate')
          .send({
            username: user.username,
            password: user.rawPassword
          })
          .expect(function(res) {
            expect(res.body).to.has.property('refresh');
            expect(res.body).to.has.property('access');
          })
          .expect(200);
      });
    });
  });

  describe('Authentication (BASIC)', function() {
    describe('Given no authorization header', function() {
      it('should return UNAUTHORIZED', function * () {
        yield request
          .get('/roles')
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'UNAUTHORIZED');
            expect(res.headers).to.has.property('www-authenticate');
          })
          .expect(401);
      });
    });
    describe('Given no invalid credentials', function() {
      it('should return INVALID_USERNAME', function * () {
        yield request
          .get('/roles')
          .auth(admin.username + '0', admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'UNAUTHORIZED');
          })
          .expect(401);
      });

      it('should return INVALID_PASSWORD', function * () {
        yield request
          .get('/roles')
          .auth(admin.username, admin.password + '0')
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'UNAUTHORIZED');
          })
          .expect(401);
      });
    });
    describe('Given valid credentials', function() {
      it('should return 200', function * () {
        yield request
          .get('/roles')
          .auth(admin.username, admin.password)
          .expect(200);
      });
    });
  });
});
