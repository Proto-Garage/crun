/* globals app, Execution, Util */
import {expect} from 'chai';
import mongoose from 'mongoose';
import _ from 'lodash';
import {generate as randString} from 'rand-token';

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

  describe('Executions', function() {
    describe('POST /executions', function() {
      let group;
      let command;

      before(function* () {
        let result = yield request
          .post('/commands')
          .send({name: 'sleepy-snorlax', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        command = result.body;

        result = yield request
          .post('/groups')
          .send({
            name: 'pokemon',
            queue: 'pokemon',
            members: [{
              type: 'command',
              _id: command._id
            }]
          })
          .auth(admin.username, admin.password)
          .expect(201);

        group = result.body;
      });

      it('should create new execution object', function* () {
        let result = yield request
          .post('/executions')
          .send({group: group._id})
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('_id');
            expect(res.body).to.has.property('uri');
          })
          .expect(201);

        yield Util.delay(2500);

        let execution = yield Execution.findById(result.body._id).exec();
        expect(execution.group.toHexString()).to.equal(group._id);
        expect(execution.status).to.has.property('status', 'SUCCEEDED');
        expect(execution.status).to.has.property('startedAt');
        expect(execution.status).to.has.property('elapsedTime');
      });

      it('should queue executions', function* () {
        let result = [];
        result[0] = yield request
          .post('/executions')
          .send({group: group._id})
          .auth(admin.username, admin.password)
          .expect(201);

        yield Util.delay(500);

        result[1] = yield request
          .post('/executions')
          .send({group: group._id})
          .auth(admin.username, admin.password)
          .expect(201);

        {
          let execution = yield Execution.findById(result[0].body._id).exec();
          expect(execution.status).to.has.property('status', 'STARTED');
        }

        {
          let execution = yield Execution.findById(result[1].body._id).exec();
          expect(execution.status).to.has.property('status', 'QUEUED');
        }

        yield Util.delay(2000);

        {
          let execution = yield Execution.findById(result[0].body._id).exec();
          expect(execution.status).to.has.property('status', 'SUCCEEDED');
        }

        {
          let execution = yield Execution.findById(result[1].body._id).exec();
          expect(execution.status).to.has.property('status', 'STARTED');
        }

        yield Util.delay(2000);

        {
          let execution = yield Execution.findById(result[1].body._id).exec();
          expect(execution.status).to.has.property('status', 'SUCCEEDED');
        }
      });

      it('should return INVALID_REQUEST', function* () {
        yield request
          .post('/executions')
          .send({group: new ObjectId().toString()})
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.have.property('code', 'INVALID_REQUEST');
          })
          .expect(400);
      });
    });

    describe('GET /executions/:id', function() {
      let command;
      before(function* () {
        let result = yield request
          .post('/commands')
          .send({name: 'sleepy-pikachu', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        command = result.body;
      });

      it('should return execution object', function* () {
        let result = yield request
          .post('/groups')
          .send({
            name: 'pokemon',
            queue: 'pokemon',
            members: [{
              type: 'command',
              _id: command._id
            }]
          })
          .auth(admin.username, admin.password)
          .expect(201);
        let group = result.body;

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
            expect(res.body.data).to.has.property('status');
            expect(res.body.data.status)
              .to.has.deep.property('_id', group._id);
            expect(res.body.data.status)
              .to.has.deep.property('status', 'STARTED');
            expect(res.body.data.status)
              .to.has.deep.property('startedAt');
            expect(res.body.data.status)
              .to.has.deep.property('elapsedTime');
            expect(res.body.data.status)
              .to.has.deep.property('type', 'group');
            expect(res.body.data.status)
              .to.has.deep.property('members[0]._id', command._id);
            expect(res.body.data.status)
              .to.has.deep.property('members[0].status', 'STARTED');
            expect(res.body.data.status)
              .to.has.deep.property('members[0].startedAt');
            expect(res.body.data.status)
              .to.has.deep.property('members[0].elapsedTime');
            expect(res.body.data.status)
              .to.has.deep.property('members[0].type', 'command');
            expect(res.body.data.status)
              .to.has.deep.property('members[0].log');
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
            expect(res.body.data).to.has.property('status');
            expect(res.body.data.status)
              .to.has.deep.property('_id', group._id);
            expect(res.body.data.status)
              .to.has.deep.property('status', 'SUCCEEDED');
            expect(res.body.data.status)
              .to.has.deep.property('startedAt');
            expect(res.body.data.status)
              .to.has.deep.property('elapsedTime');
            expect(res.body.data.status)
              .to.has.deep.property('type', 'group');
            expect(res.body.data.status)
              .to.has.deep.property('members[0]._id', command._id);
            expect(res.body.data.status)
              .to.has.deep.property('members[0].status', 'SUCCEEDED');
            expect(res.body.data.status)
              .to.has.deep.property('members[0].startedAt');
            expect(res.body.data.status)
              .to.has.deep.property('members[0].elapsedTime');
            expect(res.body.data.status)
              .to.has.deep.property('members[0].type', 'command');
            expect(res.body.data.status)
              .to.has.deep.property('members[0].log');
          })
          .expect(200);
      });

      describe('Given a nested group', function() {
        let groupOne;
        let groupTwo;

        before(function* () {
          {
            let result = yield request
              .post('/groups')
              .send({
                name: 'group ' + randString(8),
                executionType: 'parallel',
                members: _.map(_.range(3), () => {
                  return {
                    type: 'command',
                    _id: command._id
                  };
                })
              })
              .auth(admin.username, admin.password)
              .expect(201);
            groupOne = result.body;
          }

          {
            let result = yield request
              .post('/groups')
              .send({
                name: 'group ' + randString(8),
                executionType: 'series',
                members: [{
                  type: 'group',
                  _id: groupOne._id
                }, {
                  type: 'command',
                  _id: command._id
                }]
              })
              .auth(admin.username, admin.password)
              .expect(201);
            groupTwo = result.body;
          }
        });

        it('should return execution object', function* () {
          let result = yield request
            .post('/executions')
            .send({group: groupOne._id})
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
              expect(res.body.data).to.has.property('status');
              expect(res.body.data.status)
                .to.has.deep.property('_id', groupOne._id);
              expect(res.body.data.status)
                .to.has.deep.property('status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep.property('startedAt');
              expect(res.body.data.status)
                .to.has.deep.property('elapsedTime');
              expect(res.body.data.status)
                .to.has.deep.property('type', 'group');
              expect(res.body.data.status)
                .to.has.deep.property('members[0]._id', command._id);
              expect(res.body.data.status)
                .to.has.deep.property('members[0].status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].startedAt');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].elapsedTime');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].type', 'command');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].log');
              expect(res.body.data.status)
                .to.has.deep.property('members[1]._id', command._id);
              expect(res.body.data.status)
                .to.has.deep.property('members[1].status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].startedAt');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].elapsedTime');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].type', 'command');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].log');
              expect(res.body.data.status)
                .to.has.deep.property('members[2]._id', command._id);
              expect(res.body.data.status)
                .to.has.deep.property('members[2].status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep.property('members[2].startedAt');
              expect(res.body.data.status)
                .to.has.deep.property('members[2].elapsedTime');
              expect(res.body.data.status)
                .to.has.deep.property('members[2].type', 'command');
              expect(res.body.data.status)
                .to.has.deep.property('members[2].log');
            })
            .expect(200);

          yield Util.delay(2000);

          yield request
            .get('/executions/' + execution._id)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body.data.status)
                .to.has.deep.property('status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep.property('members[2].status', 'SUCCEEDED');
            })
            .expect(200);
        });

        it('should return execution object', function* () {
          let result = yield request
            .post('/executions')
            .send({group: groupTwo._id})
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
              expect(res.body.data).to.has.property('status');
              expect(res.body.data.status)
                .to.has.deep.property('_id', groupTwo._id);
              expect(res.body.data.status)
                .to.has.deep.property('status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep.property('startedAt');
              expect(res.body.data.status)
                .to.has.deep.property('elapsedTime');
              expect(res.body.data.status)
                .to.has.deep.property('type', 'group');
              expect(res.body.data.status)
                .to.has.deep.property('members[0]._id', groupOne._id);
              expect(res.body.data.status)
                .to.has.deep.property('members[0].status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].startedAt');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].elapsedTime');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].type', 'group');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[0]._id', command._id);
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[0].status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[0].startedAt');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[0].elapsedTime');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[0].type', 'command');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[0].log');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[1]._id', command._id);
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[1].status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[1].startedAt');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[1].elapsedTime');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[1].type', 'command');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[1].log');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[2]._id', command._id);
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[2].status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[2].startedAt');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[2].elapsedTime');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[2].type', 'command');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[2].log');
              expect(res.body.data.status)
                .to.has.deep.property('members[1]._id', command._id);
              expect(res.body.data.status)
                .to.has.deep.property('members[1].status', 'PENDING');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].startedAt');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].elapsedTime');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].type', 'command');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].log');
            })
            .expect(200);

          yield Util.delay(2000);

          yield request
            .get('/executions/' + execution._id)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body.data.status)
                .to.has.deep.property('status', 'STARTED');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[0].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[1].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[2].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].status', 'STARTED');
            })
            .expect(200);

          yield Util.delay(2000);

          yield request
            .get('/executions/' + execution._id)
            .auth(admin.username, admin.password)
            .expect(function(res) {
              expect(res.body.data.status)
                .to.has.deep.property('status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep.property('members[0].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[0].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[1].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep
                .property('members[0].members[2].status', 'SUCCEEDED');
              expect(res.body.data.status)
                .to.has.deep.property('members[1].status', 'SUCCEEDED');
            })
            .expect(200);
        });
      });

      it('should return 404', function* () {
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
      it('should return all execution instances', function* () {
        yield request
          .get('/executions')
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body.links).to.has.property('last');
            expect(res.body).to.has.property('data');
            _.each(res.body.data, item => {
              expect(item).to.has.property('createdAt');
              expect(item).to.has.property('status');
            });
          })
          .expect(200);
      });
    });
  });
});
