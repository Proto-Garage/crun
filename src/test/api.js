/* globals app, User, Role */
import {expect} from 'chai';
import {generate as randString} from 'rand-token';
import _ from 'lodash';

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

  describe('POST /authenticate', function() {
    let user;
    let role;

    before(function * () {
      role = new Role({
        name: 'admin',
        permissions: [
          {operation: 'CREATE_USER'},
          {operation: 'CREATE_COMMAND'},
          {operation: 'CREATE_GROUP'},
          {operation: 'CREATE_ROLE'},
          {operation: 'EXECUTE_GROUP'}
        ]
      });
      yield role.save();

      user = new User({
        username: 'test_user_' + randString(8),
        password: randString(26),
        roles: [role]
      });
      yield user.save();
    });

    after(function * () {
      yield Role.remove(role);
      yield User.remove(user);
    });

    describe('Given valid credentials', function() {
      let token;

      it('should return access token and refresh token', function * () {
        yield request
          .post('/authenticate')
          .send({
            username: user.username,
            password: user.rawPassword
          })
          .expect(function(res) {
            expect(res.body).to.has.property('refreshToken');
            expect(res.body).to.has.property('accessToken');

            let refreshToken = JSON.parse(new Buffer(
              res.body.refreshToken.match(/^.+\.(.+)\..+$/)[1], 'base64'));
            let accessToken = JSON.parse(new Buffer(
              res.body.accessToken.match(/^.+\.(.+)\..+$/)[1], 'base64'));

            expect(refreshToken).to.has.property('user', user._id.toString());
            expect(accessToken).to.has.property('user', user._id.toString());

            token = res.body;
          })
          .expect(200);
      });

      it('should return 200', function * () {
        yield request
          .get('/roles')
          .set('Authorization', 'Access ' + token.accessToken)
          .expect(200);
      });

      describe('POST /refreshToken', function() {
        describe('Given valid parameters', function() {
          it('should create new access token', function * () {
            let accessToken;
            yield request
              .post('/refreshToken')
              .send(_.pick(token, 'refreshToken'))
              .expect(200)
              .expect(function(res) {
                expect(res.body).to.has.property('accessToken');
                accessToken = res.body.accessToken;
              });

            yield request
              .get('/roles')
              .set('Authorization', 'Access ' + accessToken)
              .expect(200);
          });
        });
        describe('Given invalid parameters', function() {
          it('should return 400', function * () {
            yield request
              .post('/refreshToken')
              .send({refreshToken: randString(32)})
              .expect(400)
              .expect(function(res) {
                expect(res.body).to.has.property('code', 'INVALID_REQUEST');
              });
          });
        });
      });
    });

    describe('Given invalid credentials', function() {
      it('should return UNAUTHORIZED', function * () {
        yield request
          .post('/authenticate')
          .send({
            username: user.username + '0',
            password: user.rawPassword
          })
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'UNAUTHORIZED');
          })
          .expect(401);
      });
      it('should return UNAUTHORIZED', function * () {
        yield request
          .post('/authenticate')
          .send({
            username: user.username,
            password: user.rawPassword + '0'
          })
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'UNAUTHORIZED');
          })
          .expect(401);
      });
      it('should return 401', function * () {
        yield request
          .get('/roles')
          .set('Authorization', 'Access ' + randString(32))
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'UNAUTHORIZED');
          })
          .expect(401);
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
      it('should return UNAUTHORIZED', function * () {
        yield request
          .get('/roles')
          .auth(admin.username + '0', admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'UNAUTHORIZED');
          })
          .expect(401);
      });

      it('should return UNAUTHORIZED', function * () {
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
