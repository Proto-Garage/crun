/* globals app, Util */
/* eslint max-nested-callbacks: ["error", 6] */
import _ from 'lodash';
import {expect} from 'chai';
import {v4 as uid} from 'uuid';

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

  describe('Logs', function() {
    let execution;
    before(function* () {
      let result = yield request
        .post('/commands')
        .send({
          name: 'sleepy-heads',
          command: _.map([
            'one', 'two', 'three'
          ], item => `echo "${item}"`)
            .join(' && sleep 2 && ')
        })
        .auth(admin.username, admin.password)
        .expect(201);
      let command = result.body;

      result = yield request
        .post('/groups')
        .send({
          name: 'pokemon',
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
        .send({group: group._id})
        .auth(admin.username, admin.password)
        .expect(201);

      result = yield request
        .get('/executions/' + result.body._id)
        .auth(admin.username, admin.password)
        .expect(200);

      execution = result.body;
    });

    describe('GET /logs/:id', function() {
      it('should return NOT_FOUND', function* () {
        yield request
          .get('/logs/' + uid())
          .expect(404)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'NOT_FOUND');
          });
      });

      it('should return execution log', function* () {
        let path = execution
          .data.status.members[0].log.match(/.+(\/logs\/.+)/)[1];

        yield request
          .get(path)
          .expect(function(res) {
            expect(res.text).to.equal('one\n');
          })
          .expect(200);

        yield Util.delay(2000);

        yield request
          .get(path)
          .expect(function(res) {
            expect(res.text).to.equal('one\ntwo\n');
          })
          .expect(200);

        yield Util.delay(2000);

        yield request
          .get(path)
          .expect(function(res) {
            expect(res.text).to.equal('one\ntwo\nthree\n');
          })
          .expect(200);
      });
    });
  });
});
