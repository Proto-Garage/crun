/* globals app, Role, Command */
/* eslint max-nested-callbacks: ["error", 6]*/
import {expect} from 'chai';
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
    it('should return INVALID_ROLE_OPERATION', function * () {
      yield request
        .post('/roles')
        .send({name: 'staging', operations: [{name: 'CREATE_SOMETHING'}]})
        .auth(admin.username, admin.password)
        .expect(function(res) {
          expect(res.body).to.has.property('code', 'INVALID_ROLE_OPERATION');
        })
        .expect(400);
    });
    it('should return validation error', function * () {
      yield request
        .post('/roles')
        .send({operations: [{name: 'CREATE_ROLE'}]})
        .auth(admin.username, admin.password)
        .expect(function(res) {
          expect(res.body).to.has.property('code', 'INVALID_REQUEST');
        })
        .expect(400);
    });
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
          expect(res.body.data[0].operations[0])
            .to.has.property('name', 'CREATE_ROLE');
        })
        .expect(200);
    });
  });
  describe('Commands', function() {
    describe('POST /commands', function() {
      it('should create new command', function * () {
        let command = {
          name: 'sleep',
          command: 'sleep 5'
        };

        yield request
          .post('/commands')
          .send(command)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.have.property('uri');
            expect(res.body).to.have.property('_id');
          })
          .expect(201);

        command = yield Command.findOne({name: 'sleep'}).exec();
        expect(command).to.has.property('name', 'sleep');
        expect(command).to.has.property('command', 'sleep 5');
      });
      it('should return INVALID_REQUEST', function * () {
        yield request
          .post('/commands')
          .send({name: 'sleep'})
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.have.property('code', 'INVALID_REQUEST');
          })
          .expect(400);
      });
    });
    describe('GET /commands', function() {
      before(function * () {
        yield _.times(20, item => {
          return request
            .post('/commands')
            .send({name: 'test_' + item, command: 'sleep 2'})
            .auth(admin.username, admin.password)
            .expect(201);
        });
      });
      it('should retrieve all commands', function * () {
        yield request
          .get('/commands')
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body).to.has.property('data').that.is.a('array');
            _.each(res.body.data, item => {
              expect(item).to.has.property('_id');
              expect(item).to.has.property('uri');
              expect(item).to.has.property('name');
              expect(item).to.has.property('command');
            });
          })
          .expect(200);
      });
    });
    describe('GET /commands/:id', function() {
      let uri;
      before(function * () {
        let res = yield request
          .post('/commands')
          .send({name: 'sleepy', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        uri = res.body.uri.replace(process.env.BASE_URL, '');
      });
      it('should retrieve single command', function * () {
        yield request
          .get(uri)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body).to.has.property('data');
            expect(res.body.data).to.has.property('_id');
            expect(res.body.data).to.has.property('name');
            expect(res.body.data).to.has.property('command');
          })
          .expect(200);
      });
      it('should return 404', function * () {
        yield request
          .get(uri + '0')
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'NOT_FOUND');
          })
          .expect(404);
      });
    });
    describe('DELETE /commands/:id', function() {
      let uri;
      let _id;
      before(function * () {
        let res = yield request
          .post('/commands')
          .send({name: 'sleepy', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(function(res) {
            _id = res.body._id;
          })
          .expect(201);

        uri = res.body.uri.replace(process.env.BASE_URL, '');
      });
      it('should retrieve single command', function * () {
        yield request
          .delete(uri)
          .auth(admin.username, admin.password)
          .expect(200);

        let command = yield Command.findById(_id).exec();
        expect(command).to.be.equal(null);
      });
      it('should return 404', function * () {
        yield request
          .get(uri + '0')
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'NOT_FOUND');
          })
          .expect(404);
      });
    });
  });
});
