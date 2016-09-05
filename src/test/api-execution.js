/* globals app, Execution, Util */
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

  describe('Executions', function() {
    describe('POST /executions', function() {
      let group;

      before(function * () {
        let result = yield request
          .post('/commands')
          .send({name: 'sleepy-snorlax', command: 'sleep 1'})
          .auth(admin.username, admin.password)
          .expect(201);

        result = yield request
          .post('/groups')
          .send({
            name: 'pokemon',
            queue: 'pokemon',
            group: {
              type: 'command',
              _id: result.body._id
            }
          })
          .auth(admin.username, admin.password)
          .expect(201);

        group = result.body;
      });

      it('should create new execution object', function * () {
        let result = yield request
          .post('/executions')
          .send({group: group._id})
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('_id');
            expect(res.body).to.has.property('uri');
          })
          .expect(201);

        yield Util.delay(1500);

        let execution = yield Execution.findById(result.body._id).exec();
        expect(execution.group.toHexString()).to.equal(group._id);
      });

      it('should return INVALID_REQUEST', function * () {
        yield request
          .post('/executions')
          .send({group: new ObjectId().toHexString()})
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.have.property('code', 'INVALID_REQUEST');
          })
          .expect(400);
      });
    });

    describe('GET /executions/:id', function() {
      let command;
      before(function * () {
        let result = yield request
          .post('/commands')
          .send({name: 'sleepy-pikachu', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        command = result.body;
      });

      it('should return execution object', function * () {
        let result = yield request
          .post('/groups')
          .send({
            name: 'pokemon',
            queue: 'pokemon',
            group: {
              type: 'command',
              _id: command._id
            }
          })
          .auth(admin.username, admin.password)
          .expect(201);

        result = yield request
          .post('/executions')
          .send({group: result.body._id})
          .auth(admin.username, admin.password)
          .expect(201);

        let execution = result.body;

        yield request
          .get('/executions/' + execution._id)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body.data).to.has.property('createdAt');
            expect(res.body.data).to.has.property('group');
            expect(res.body.data).to.has.property('status');
            expect(res.body.data.status).to.has.property('status', 'STARTED');
            expect(res.body.data.status).to.has.property('type');
            expect(res.body.data.status).to.has.property('startedAt');
            expect(res.body.data.status).to.has.property('elapsedTime');
          })
          .expect(200);

        yield Util.delay(2500);

        yield request
          .get('/executions/' + execution._id)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body.data).to.has.property('createdAt');
            expect(res.body.data).to.has.property('group');
            expect(res.body.data).to.has.property('status');
            expect(res.body.data.status).to.has.property('status', 'SUCCEEDED');
            expect(res.body.data.status).to.has.property('type');
            expect(res.body.data.status).to.has.property('startedAt');
            expect(res.body.data.status).to.has.property('elapsedTime');
          })
          .expect(200);
      });

      it('should return execution object', function * () {
        let result = yield request
          .post('/groups')
          .send({
            name: 'pokemon',
            queue: 'pokemon',
            group: {
              type: 'serial',
              groups: [{
                type: 'parallel',
                groups: [{
                  type: 'command',
                  _id: command._id
                }, {
                  type: 'command',
                  _id: command._id
                }]
              }, {
                type: 'command',
                _id: command._id
              }]
            }
          })
          .auth(admin.username, admin.password)
          .expect(201);

        result = yield request
          .post('/executions')
          .send({group: result.body._id})
          .auth(admin.username, admin.password)
          .expect(201);

        let execution = result.body;

        yield request
          .get('/executions/' + execution._id)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(_.get(res.body.data.status, 'status'), 'STARTED');
            expect(_.get(res.body.data.status,
              'status.groups[0].groups[0]'), 'STARTED');
            expect(_.get(res.body.data.status,
              'status.groups[0].groups[1]'), 'STARTED');
            expect(_.get(res.body.data.status,
              'status.groups[1].status'), 'PENDING');
          })
          .expect(200);

        yield Util.delay(2500);

        yield request
          .get('/executions/' + execution._id)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(_.get(res.body.data.status, 'status'), 'STARTED');
            expect(_.get(res.body.data.status,
              'status.groups[0].groups[0]'), 'SUCCEEDED');
            expect(_.get(res.body.data.status,
              'status.groups[0].groups[1]'), 'SUCCEEDED');
            expect(_.get(res.body.data.status,
              'status.groups[1].status'), 'STARTED');
          })
          .expect(200);

        yield Util.delay(2000);

        yield request
          .get('/executions/' + execution._id)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(_.get(res.body.data.status, 'status'), 'SUCCEEDED');
            expect(_.get(res.body.data.status,
              'status.groups[0].groups[0]'), 'SUCCEEDED');
            expect(_.get(res.body.data.status,
              'status.groups[0].groups[1]'), 'SUCCEEDED');
            expect(_.get(res.body.data.status,
              'status.groups[1].status'), 'SUCCEEDED');
          })
          .expect(200);
      });

      it('should return execution object', function * () {
        let result = yield request
          .post('/groups')
          .send({
            name: 'pokemon',
            queue: 'pokemon',
            group: {
              type: 'command',
              _id: command._id
            }
          })
          .auth(admin.username, admin.password)
          .expect(201);

        let group = result.body;

        let executions = [];
        result = yield request
          .post('/executions')
          .send({group: group._id})
          .auth(admin.username, admin.password)
          .expect(201);

        executions.push(result.body);

        result = yield request
          .post('/executions')
          .send({group: group._id})
          .auth(admin.username, admin.password)
          .expect(201);

        executions.push(result.body);
        yield [
          request
            .get('/executions/' + executions[0]._id)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body.data.status).to.has.property('status', 'STARTED');
            })
            .expect(200),
          request
            .get('/executions/' + executions[1]._id)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body.data.status).to.has.property('status', 'PENDING');
            })
            .expect(200)
        ];

        yield Util.delay(1000);

        yield [
          request
            .get('/executions/' + executions[0]._id)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body.data.status)
                .to.has.property('status', 'SUCCEEDED');
            })
            .expect(200),
          request
            .get('/executions/' + executions[1]._id)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body.data.status).to.has.property('status', 'STARTED');
            })
            .expect(200)
        ];

        yield Util.delay(2000);

        yield [
          request
            .get('/executions/' + executions[0]._id)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body.data.status)
                .to.has.property('status', 'SUCCEEDED');
            })
            .expect(200),
          request
            .get('/executions/' + executions[1]._id)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body.data.status)
                .to.has.property('status', 'SUCCEEDED');
            })
            .expect(200)
        ];
      });

      it('should return 404', function * () {
        yield request
          .get('/executions/' + new ObjectId().toHexString())
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'NOT_FOUND');
          })
          .expect(404);
      });
    });

    describe('GET /executions', function() {
      it('should return all execution instances', function * () {
        yield request
          .get('/executions')
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body.links).to.has.property('next');
            expect(res.body).to.has.property('data');
            _.each(res.body.data, item => {
              expect(item).to.has.property('group');
              expect(item).to.has.property('createdAt');
              expect(item).to.has.property('status');
            });
          })
          .expect(200);
      });
    });
  });
});
