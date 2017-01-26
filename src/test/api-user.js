/* globals app, User */
import {expect} from 'chai';
import _ from 'lodash';
import {generate as randString} from 'rand-token';
import mongoose from 'mongoose';

let ObjectId = mongoose.Types.ObjectId;

let request;

describe('CRUN API', function() {
  this.timeout(20000);

  let admin = {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
  };

  before(function* () {
    yield app.started;
    request = require('supertest')(app.server);
  });

  after(function* () {
    app.server.close();
  });

  describe('Users', function() {
    describe('POST /users', function() {
      let role;

      before(function* () {
        let result = yield request
          .post('/roles')
          .send({name: 'role ' + randString(8), operations: [
            {name: 'WRITE_COMMAND'},
            {name: 'READ_COMMAND'},
            {name: 'WRITE_GROUP'},
            {name: 'READ_GROUP'},
            {name: 'EXECUTE_GROUP'}
          ]})
          .auth(admin.username, admin.password)
          .expect(201);

        role = result.body;
      });

      describe('Given valid parameters', function() {
        it('should create new user', function* () {
          let params = {
            username: 'users_' + randString(6),
            password: randString(16),
            roles: [role._id]
          };

          let result = yield request
            .post('/users')
            .send(params)
            .auth(admin.username, admin.password)
            .expect(201)
            .expect(function(res) {
              expect(res.body).to.has.property('uri');
              expect(res.body).to.has.property('_id');
            });

          let user = yield User
            .findById(result.body._id)
            .populate('roles')
            .lean(true)
            .exec();

          expect(user).to.has.property('username', params.username);
          expect(user).to.has.property('roles');
        });
      });

      describe('Given invalid parameters', function() {
        it('should return invalid request', function* () {
          let params = {
            username: 'users_' + randString(6)
          };

          yield request
            .post('/users')
            .send(params)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body).to.has.property('code', 'INVALID_REQUEST');
            })
            .expect(400);
        });

        it('should return invalid request', function* () {
          let params = {
            username: 'users_' + randString(6),
            password: randString(6)
          };

          yield request
            .post('/users')
            .send(params)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body).to.has.property('code', 'INVALID_REQUEST');
            })
            .expect(400);
        });
      });
    });

    describe('DELETE /users/:id', function() {
      let user = {
        username: 'users_' + randString(6),
        password: randString(16)
      };
      before(function* () {
        let result = yield request
          .post('/users')
          .send(user)
          .auth(admin.username, admin.password)
          .expect(201);

        user._id = result.body._id;
      });

      it('should remove single user', function* () {
        yield request
          .delete('/users/' + user._id)
          .auth(admin.username, admin.password)
          .expect(200);

        user = yield User.findById(user._id).exec();
        expect(user).to.be.equal(null);
      });
    });

    describe('GET /users/:id', function() {
      let user = {
        username: 'users_' + randString(6),
        password: randString(16)
      };
      before(function* () {
        let result = yield request
          .post('/users')
          .send(user)
          .auth(admin.username, admin.password)
          .expect(201);

        user._id = result.body._id;
      });

      it('should retrieve single user', function* () {
        yield request
          .get('/users/' + user._id)
          .auth(admin.username, admin.password)
          .expect(200)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body).to.has.property('data');
            expect(res.body.data).to.has.property('username');
            expect(res.body.data).to.has.property('createdAt');
            expect(res.body.data).to.has.property('roles');
          });
      });

      it('should return NOT_FOUND', function* () {
        yield request
          .get('/users/' + new ObjectId().toHexString())
          .auth(admin.username, admin.password)
          .expect(404)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'NOT_FOUND');
          });
      });
    });

    describe('GET /users', function() {
      before(function* () {
        yield _.times(10, () => {
          return request
            .post('/users')
            .send({
              username: 'users_' + randString(6),
              password: randString(16)
            })
            .auth(admin.username, admin.password)
            .expect(201);
        });
      });

      it('should retrieve users', function* () {
        let result = yield request
          .get('/users')
          .auth(admin.username, admin.password)
          .expect(200)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body.links).to.has.property('next');
            expect(res.body).to.has.property('data').that.is.a('array');
            _.each(res.body.data, item => {
              expect(item).to.has.property('_id');
              expect(item).to.has.property('username');
              expect(item).to.has.property('createdAt');
              expect(item).to.has.property('roles');
            });
          });

        yield _.map(result.body.data, item => {
          return function* () {
            let user = yield User.findById(item._id).exec();
            expect(user).to.not.equal(null);
          };
        });
      });
    });
  });
});
