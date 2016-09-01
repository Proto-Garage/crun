/* globals app, Execution */
/* eslint max-nested-callbacks: ["error", 6]*/
import {expect} from 'chai';
import mongoose from 'mongoose';

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
          .send({name: 'sleepy-snorlax', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        result = yield request
          .post('/groups')
          .send({
            name: 'test group 1',
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
            console.log(res.body);
          })
          .expect(201);

        let execution = yield Execution.findById(result.body._id).exec();
        console.log(execution);
        // expect(execution).to.has.property('name', 'sleep');
        // expect(execution).to.has.property('command', 'sleep 5');
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
  });
});
