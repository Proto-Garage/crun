/* globals app, Role */
/* eslint max-nested-callbacks: ["error", 6]*/
import {expect} from 'chai';

let request;

describe('CRUN API', function() {
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

  describe('Authentication', function() {
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
            expect(res.body).to.has.property('code', 'INVALID_USERNAME');
          })
          .expect(403);
      });

      it('should return INVALID_PASSWORD', function * () {
        yield request
          .get('/roles')
          .auth(admin.username, admin.password + '0')
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'INVALID_PASSWORD');
          })
          .expect(403);
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

  describe('Roles', function() {
    it('should create new role', function * () {
      yield request
        .post('/roles')
        .send({name: 'staging', operations: [{name: 'CREATE_ROLE'}]})
        .auth(admin.username, admin.password)
        .expect(201);

      let role = yield Role.findOne({name: 'staging'}).exec();
      expect(role).to.has.property('name', 'staging');
    });
    it('should return all roles', function * () {
      yield request
        .get('/roles')
        .auth(admin.username, admin.password)
        .expect(function(res) {
          expect(res.body).to.has.property('links');
          expect(res.body.links).to.has.property('self');
          expect(res.body).to.has.property('data');
          expect(res.body.data[0]).to.has.property('name', 'staging');
          expect(res.body.data[0]).to.has.property('operations');
          expect(res.body.data[0].operations[0]).to.has.property('name', 'CREATE_ROLE');
        })
        .expect(200);
    });
  });
});
