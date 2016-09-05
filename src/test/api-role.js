/* globals app, Role */
/* eslint max-nested-callbacks: ["error", 6]*/
import {expect} from 'chai';
import mongoose from 'mongoose';
import _ from 'lodash';

let ObjectId = mongoose.Types.ObjectId;

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

  describe('Roles', function() {
    describe('POST /roles', function() {
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
          .send({operations: [{name: 'WRITE_COMMAND'}]})
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'INVALID_REQUEST');
          })
          .expect(400);
      });
      it('should create new role', function * () {
        let result = yield request
          .post('/roles')
          .send({name: 'staging', operations: [{name: 'WRITE_COMMAND'}]})
          .auth(admin.username, admin.password)
          .expect(201)
          .expect(function(res) {
            expect(res.body).to.has.property('uri');
            expect(res.body).to.has.property('_id');
          });

        let role = yield Role.findById(result.body._id).exec();
        expect(role).to.has.property('name', 'staging');
      });
    });
    describe('GET /roles/:id', function() {
      let role;

      before(function * () {
        let result = yield request
          .post('/roles')
          .send({name: 'test', operations: [
            {name: 'WRITE_COMMAND'},
            {name: 'READ_COMMAND'}
          ]})
          .auth(admin.username, admin.password)
          .expect(201);

        role = result.body;
      });

      it('should return single role', function * () {
        yield request
          .get('/roles/' + role._id)
          .auth(admin.username, admin.password)
          .expect(200)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body).to.has.property('data');
            expect(res.body.data).to.has.property('name', 'test');
            expect(res.body.data).to.has.property('operations');
            console.log(res.body.data.operations);
          });
      });

      it('should return NOT_FOUND', function * () {
        yield request
          .get('/roles/' + new ObjectId().toHexString())
          .auth(admin.username, admin.password)
          .expect(404)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'NOT_FOUND');
          });
      });
    });
    describe('GET /roles', function() {
      it('should return all roles', function * () {
        yield request
          .get('/roles')
          .auth(admin.username, admin.password)
          .expect(200)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body.links).to.has.property('next');
            expect(res.body).to.has.property('data');
            _.each(res.body.data, item => {
              expect(item).to.has.property('name');
              expect(item).to.has.property('operations');
            });
          });
      });
    });

    describe('DELETE /roles/:id', function() {
      let role;

      before(function * () {
        let result = yield request
          .post('/roles')
          .send({name: 'test', operations: [
            {name: 'WRITE_COMMAND'},
            {name: 'READ_COMMAND'}
          ]})
          .auth(admin.username, admin.password)
          .expect(201);

        role = result.body;
      });

      it('should return single role', function * () {
        yield request
          .delete('/roles/' + role._id)
          .auth(admin.username, admin.password)
          .expect(200);

        let testRole = yield Role.findById(role._id).exec();
        expect(testRole).to.equal(null);
      });

      it('should return NOT_FOUND', function * () {
        yield request
          .get('/roles/' + new ObjectId().toHexString())
          .auth(admin.username, admin.password)
          .expect(404)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'NOT_FOUND');
          });
      });
    });
  });
});
