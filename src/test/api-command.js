/* globals app, Command */
/* eslint max-nested-callbacks: ["error", 6]*/
import {expect} from 'chai';
import _ from 'lodash';
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

  describe('Commands', function() {
    describe('POST /commands', function() {
      it('should create new command', function* () {
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
      it('should return INVALID_REQUEST', function* () {
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
      before(function* () {
        yield _.times(20, item => {
          return request
            .post('/commands')
            .send({name: 'test_' + item, command: 'sleep 2'})
            .auth(admin.username, admin.password)
            .expect(201);
        });
      });
      it('should retrieve all commands', function* () {
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
              expect(item).to.has.property('timeout');
              expect(item).to.has.property('command');
              expect(item).to.has.property('enabled');
            });
          })
          .expect(200);
      });
    });
    describe('GET /commands/:id', function() {
      let command;
      before(function* () {
        let res = yield request
          .post('/commands')
          .send({name: 'sleepy', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        command = res.body;
      });
      it('should retrieve single command', function* () {
        yield request
          .get('/commands/' + command._id)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body).to.has.property('data');
            expect(res.body.data).to.has.property('name');
            expect(res.body.data).to.has.property('timeout');
            expect(res.body.data).to.has.property('command');
            expect(res.body.data).to.has.property('enabled');
          })
          .expect(200);
      });
      it('should return 404', function* () {
        yield request
          .get('/commands/' + new ObjectId().toHexString())
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'NOT_FOUND');
          })
          .expect(404);
      });
    });
    describe('DELETE /commands/:id', function() {
      let command;
      before(function* () {
        let res = yield request
          .post('/commands')
          .send({name: 'sleepy', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        command = res.body;
      });
      it('should retrieve single command', function* () {
        yield request
          .delete('/commands/' + command._id)
          .auth(admin.username, admin.password)
          .expect(200);

        let dbCommand = yield Command.findById(command._id).exec();
        expect(dbCommand).to.be.equal(null);
      });
      it('should return 404', function* () {
        yield request
          .get('/commands/' + new ObjectId().toHexString())
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'NOT_FOUND');
          })
          .expect(404);
      });
    });
    describe('PATCH /commands/:id', function() {
      let command;

      before(function* () {
        let res = yield request
          .post('/commands')
          .send({name: 'sleepy 2', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        command = res.body;
      });
      it('should retrieve single command', function* () {
        yield request
          .patch('/commands/' + command._id)
          .send({name: 'updated'})
          .auth(admin.username, admin.password)
          .expect(200);

        let dbCommand = yield Command.findById(command._id).exec();
        expect(dbCommand.name).to.be.equal('updated');
      });
    });
  });
});
