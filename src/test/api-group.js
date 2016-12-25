/* globals app, Group, Command */
/* eslint max-nested-callbacks: ["error", 6]*/
import {expect} from 'chai';
import mongoose from 'mongoose';
import rand from 'rand-token';
import Promise from 'bluebird';
import _ from 'lodash';
import co from 'co';

let ObjectId = mongoose.Types.ObjectId;

let request;

describe('CRUN API', function() {
  this.timeout(30000);

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

  describe('Groups', function() {
    describe('POST /groups', function() {
      after(function * () {
        yield Group.remove().exec();
        yield Command.remove().exec();
      });
      describe('Given valid parameters', function() {
        let command;
        before(function * () {
          let result = yield request
            .post('/commands')
            .send({name: 'sleepy-head', command: 'sleep 2'})
            .auth(admin.username, admin.password)
            .expect(201);

          command = result.body;
        });
        it('should create new group', function * () {
          let group = {
            name: 'group ' + rand.generate(12),
            members: [{
              type: 'command',
              _id: command._id
            }],
            queue: 'test'
          };

          let res = yield request
            .post('/groups')
            .send(group)
            .auth(admin.username, admin.password)
            .expect(201);

          expect(res.body).to.have.property('uri');
          expect(res.body).to.have.property('_id');

          group = yield Group.findById(res.body._id).populate('members').exec();
          expect(group).to.has.property('name', group.name);
          expect(group).to.has.property('members');
          expect(group.members).to.has.length(1);
        });
      });
      describe('Given invalid parameters', function() {
        describe('Given an invalid member command', function() {
          it('should return 400', function * () {
            let group = {
              name: 'group ' + rand.generate(12),
              members: [{
                type: 'command',
                _id: rand.generate(24)
              }],
              queue: 'test'
            };

            let res = yield request
              .post('/groups')
              .send(group)
              .auth(admin.username, admin.password)
              .expect(400);

            expect(res.body).to.has.property('code', 'INVALID_REQUEST');
          });
        });
        describe('Given missing required parameters', function() {
          it('should return 400', function * () {
            let group = {
              queue: 'test'
            };

            let res = yield request
              .post('/groups')
              .send(group)
              .auth(admin.username, admin.password)
              .expect(400);

            expect(res.body).to.has.property('code', 'INVALID_REQUEST');
          });
        });
      });
      describe('Given a non-existing member', function() {
        it('should return 400', function * () {
          let group = {
            name: 'group ' + rand.generate(12),
            members: [{
              type: 'command',
              _id: new ObjectId().toString()
            }],
            queue: 'test'
          };

          let res = yield request
            .post('/groups')
            .send(group)
            .auth(admin.username, admin.password)
            .expect(400);

          expect(res.body).to.has.property('code', 'INVALID_REQUEST');
        });
      });
      describe('Given a valid member group', function() {
        it('should create new group', function * () {
          let commands = yield Promise.map(_.range(4), co.wrap(function * () {
            let payload = {
              name: 'command ' + rand.generate(8),
              command: 'sleep 1'
            };

            let result = yield request
              .post('/commands')
              .send(payload)
              .auth(admin.username, admin.password)
              .expect(201);

            return _.merge(result.body, payload);
          }));

          let groups = [];

          {
            let payload = {
              name: 'group ' + rand.generate(12),
              members: _.map(_.take(commands, 2), command => {
                return {
                  type: 'command',
                  _id: command._id
                };
              }),
              executionType: 'parallel',
              queue: 'test'
            };

            let res = yield request
              .post('/groups')
              .send(payload)
              .auth(admin.username, admin.password)
              .expect(201);

            groups.push(_.merge(res.body, payload));
          }

          {
            let payload = {
              name: 'group ' + rand.generate(12),
              members: [{
                type: 'group',
                _id: _.first(groups)._id
              }, {
                type: 'command',
                _id: _.nth(commands, 2)._id
              }],
              queue: 'test'
            };

            let res = yield request
              .post('/groups')
              .send(payload)
              .auth(admin.username, admin.password)
              .expect(201);

            groups.push(_.merge(res.body, payload));
          }

          {
            let payload = {
              name: 'group ' + rand.generate(12),
              members: [{
                type: 'group',
                _id: _.nth(groups, 1)._id
              }, {
                type: 'command',
                _id: _.nth(commands, 3)._id
              }],
              queue: 'test'
            };

            yield request
              .post('/groups')
              .send(payload)
              .auth(admin.username, admin.password)
              .expect(201);
          }
        });
      });
    });

    describe('GET /groups', function() {
      before(function * () {
        let commands = yield Promise.map(_.range(15), co.wrap(function * () {
          let command;

          {
            let payload = {
              name: 'command ' + rand.generate(8),
              command: 'sleep 1'
            };

            let result = yield request
              .post('/commands')
              .send(payload)
              .auth(admin.username, admin.password)
              .expect(201);

            command = _.merge(result.body, payload);
          }

          return command;
        }), {concurrency: 5});

        yield Promise.map(_.take(commands, 13), co.wrap(function * (command) {
          let payload = {
            name: 'group ' + rand.generate(12),
            members: [{
              type: 'command',
              _id: command._id
            }],
            queue: 'test'
          };

          yield request
            .post('/groups')
            .send(payload)
            .auth(admin.username, admin.password)
            .expect(201);
        }), {concurrency: 5});

        let group;

        {
          let payload = {
            name: 'group ' + rand.generate(12),
            members: [{
              type: 'command',
              _id: _.nth(commands, 13)._id
            }],
            executionType: 'parallel',
            queue: 'test'
          };

          let res = yield request
            .post('/groups')
            .send(payload)
            .auth(admin.username, admin.password)
            .expect(201);

          group = _.merge(res.body, payload);
        }

        {
          let payload = {
            name: 'group ' + rand.generate(12),
            members: [{
              type: 'command',
              _id: _.nth(commands, 14)._id
            }, {
              type: 'group',
              _id: group._id
            }],
            queue: 'test'
          };

          yield request
            .post('/groups')
            .send(payload)
            .auth(admin.username, admin.password)
            .expect(201);
        }
      });
      after(function * () {
        yield Group.remove().exec();
        yield Command.remove().exec();
      });

      it('should retrieve first 10 groups', function * () {
        yield request
          .get('/groups')
          .auth(admin.username, admin.password)
          .expect(function(result) {
            expect(result.body).to.has.property('links');
            expect(result.body.links).to.has.property('self');
            expect(result.body.links).to.has.property('next');
            expect(result.body.links).to.has.property('last');
            expect(result.body).to.has.property('data')
              .that.is.a('array');
            _.each(result.body.data, item => {
              expect(item).to.has.property('name');
              expect(item).to.has.property('queue');
              expect(item).to.has.property('enabled');
              expect(item).to.has.property('executionType');
              expect(item).to.has.property('members');
              expect(item).to.has.property('createdAt');
              expect(item).to.has.property('_id');
              expect(item).to.has.property('_uri');
            });
            expect(result.body.data.length).to.equal(10);
          })
          .expect(200);
      });
      it('should retrieve remaining groups', function * () {
        yield request
          .get('/groups?skip=10')
          .auth(admin.username, admin.password)
          .expect(function(result) {
            expect(result.body).to.has.property('links');
            expect(result.body.links).to.has.property('self');
            expect(result.body.links).to.not.has.property('next');
            expect(result.body.links).to.has.property('last');
            expect(result.body).to.has.property('data')
              .that.is.a('array');
            _.each(result.body.data, item => {
              expect(item).to.has.property('name');
              expect(item).to.has.property('queue');
              expect(item).to.has.property('enabled');
              expect(item).to.has.property('executionType');
              expect(item).to.has.property('members');
              expect(item).to.has.property('createdAt');
              expect(item).to.has.property('_id');
              expect(item).to.has.property('_uri');
            });
            expect(result.body.data.length).to.equal(5);
          })
          .expect(200);
      });
    });

    describe('GET /groups/:id', function() {
      let group;

      before(function * () {
        let commands = yield Promise.map(_.range(2), co.wrap(function * () {
          let payload = {
            name: 'command ' + rand.generate(8),
            command: 'sleep 1'
          };

          let result = yield request
            .post('/commands')
            .send(payload)
            .auth(admin.username, admin.password)
            .expect(201);

          return _.merge(result.body, payload);
        }), {concurrency: 5});

        {
          let payload = {
            name: 'group ' + rand.generate(12),
            members: [{
              type: 'command',
              _id: _.first(commands)._id
            }],
            queue: 'test'
          };

          let result = yield request
            .post('/groups')
            .send(payload)
            .auth(admin.username, admin.password)
            .expect(201);

          group = _.merge(result.body, payload);
        }

        {
          let payload = {
            name: 'group ' + rand.generate(12),
            members: [{
              type: 'command',
              _id: _.last(commands)._id
            }, {
              type: 'group',
              _id: group._id
            }],
            queue: 'test'
          };

          let result = yield request
            .post('/groups')
            .send(payload)
            .auth(admin.username, admin.password)
            .expect(201);

          group = _.merge(result.body, payload);
        }
      });

      it('should retrieve single group', function * () {
        yield request
          .get(`/groups/${group._id}`)
          .auth(admin.username, admin.password)
          .expect(function(result) {
            expect(result.body.data).to.has.property('name');
            expect(result.body.data).to.has.property('queue');
            expect(result.body.data).to.has.property('enabled');
            expect(result.body.data).to.has.property('executionType');
            expect(result.body.data).to.has.property('members');
            expect(result.body.data).to.has.property('createdAt');
          })
          .expect(200);
      });

      it('should retrieve single group', function * () {
        yield request
          .get(`/groups/${group._id}`)
          .query({fields: 'name,members'})
          .auth(admin.username, admin.password)
          .expect(function(result) {
            expect(result.body.data).to.has.property('name');
            expect(result.body.data).to.has.property('members');
            expect(result.body.data).to.not.has.property('queue');
            expect(result.body.data).to.not.has.property('enabled');
            expect(result.body.data).to.not.has.property('executionType');
            expect(result.body.data).to.not.has.property('createdAt');
          })
          .expect(200);
      });

      it('should retrieve single group', function * () {
        yield request
          .get(`/groups/${group._id}`)
          .query({fields: 'name,members,executionType', expand: 1})
          .auth(admin.username, admin.password)
          .expect(function(result) {
            console.dir(result.body, {depth: 5});
            expect(result.body.data).to.has.property('name');
            expect(result.body.data).to.has.property('executionType');
            expect(result.body.data).to.has.property('members');
            let checkMember = function(member) {
              expect(member).to.has.property('type');
              expect(member).to.has.property('_id');
              expect(member).to.has.property('_uri');
              if (member.type === 'group') {
                expect(member).to.has.property('name');
                expect(member).to.has.property('executionType');
                expect(member).to.has.property('members');
                _.each(member.members, checkMember);
              } else if (member.type === 'command') {
              } else {
                throw new Error(`${member.type} type is invalid.`);
              }
            };
            _.each(result.body.data.members, checkMember);
          })
          .expect(200);
      });
    });
/*
      it('should create new group', function * () {
        let group = {
          name: 'complex group',
          queue: 'test',
          group: {
            type: 'serial',
            groups: [{
              type: 'parallel',
              groups: [{
                type: 'command',
                _id: command._id
              }]
            }, {
              type: 'command',
              _id: command._id
            }]
          }
        };

        let res = yield request
          .post('/groups')
          .send(group)
          .auth(admin.username, admin.password)
          .expect(201);

        expect(res.body).to.have.property('uri');
        expect(res.body).to.have.property('_id');

        group = yield Group.findById(res.body._id).exec();
        expect(group).to.has.property('name', 'complex group');
        expect(group).to.has.property('group');
        expect(group.group).to.be.deep.equal(group.group);
      });

      it('should return INVALID_REQUEST', function * () {
        let group = {
          name: 'complex group',
          queue: 'test',
          group: {
            type: 'serial',
            groups: [{
              type: 'parallel'
            }, {
              type: 'command',
              _id: command._id
            }]
          }
        };

        yield request
          .post('/groups')
          .send(group)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'INVALID_REQUEST');
          })
          .expect(400);
      });

      it('should return INVALID_REQUEST', function * () {
        let group = {
          name: 'complex group',
          queue: 'test',
          group: {
            type: 'serial',
            groups: [{
              type: 'command',
              _id: new ObjectId().toHexString()
            }]
          }
        };

        yield request
          .post('/groups')
          .send(group)
          .auth(admin.username, admin.password)
          .expect(function(res) {
            expect(res.body).to.has.property('code', 'INVALID_REQUEST');
          })
          .expect(400);
      });
    });

    describe('GET /groups', function() {
      before(function * () {
        let result = yield request
          .post('/commands')
          .send({name: 'sleepy-head-2', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        yield _.times(20, index => {
          return request
            .post('/groups')
            .send({
              name: 'group ' + index,
              queue: 'test',
              group: {
                type: 'command',
                _id: result.body._id
              }
            })
            .auth(admin.username, admin.password)
            .expect(201);
        });
      });

      it('should return all groups', function * () {
        let result = yield request
          .get('/groups')
          .auth(admin.username, admin.password)
          .expect(200);

        expect(result.body).to.has.property('links');
        expect(result.body.links).to.has.property('self');
        expect(result.body.links).to.has.property('next');
        expect(result.body).to.has.property('data')
          .that.is.a('array');
        _.each(result.body.data, item => {
          expect(item).to.has.property('name');
          expect(item).to.has.property('queue');
          expect(item).to.has.property('createdAt');
          expect(item).to.has.property('group');
        });
      });
    });

    describe('GET /groups/:id', function() {
      let group;
      before(function * () {
        let result = yield request
          .post('/commands')
          .send({name: 'sleepy-head-3', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        result = yield request
          .post('/groups')
          .send({
            name: 'test group 1',
            queue: 'test',
            group: {
              type: 'command',
              _id: result.body._id
            }
          })
          .auth(admin.username, admin.password)
          .expect(201);

        group = result.body;
      });

      it('should return single group', function * () {
        let result = yield request
          .get('/groups/' + group._id)
          .auth(admin.username, admin.password)
          .expect(200);

        expect(result.body).to.has.property('links');
        expect(result.body.links).to.has.property('self');
        expect(result.body).to.has.property('data');
        expect(result.body.data).to.has.property('name');
        expect(result.body.data).to.has.property('queue');
        expect(result.body.data).to.has.property('createdAt');
        expect(result.body.data).to.has.property('group');
      });
    });

    describe('DELETE /groups/:id', function() {
      let group;

      before(function * () {
        let result = yield request
          .post('/commands')
          .send({name: 'sleepy-head-4', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        result = yield request
          .post('/groups')
          .send({
            name: 'test group 2',
            queue: 'test',
            group: {
              type: 'command',
              _id: result.body._id
            }
          })
          .auth(admin.username, admin.password)
          .expect(201);

        group = result.body;
      });

      it('should delete single group', function * () {
        yield request
          .delete('/groups/' + group._id)
          .auth(admin.username, admin.password)
          .expect(200);

        expect(yield Group.findById(group._id).exec()).to.be.equal(null);
      });
    });

    describe('PATCH /groups/:id', function() {
      let group;

      before(function * () {
        let result = yield request
          .post('/commands')
          .send({name: 'sleepy-head-5', command: 'sleep 2'})
          .auth(admin.username, admin.password)
          .expect(201);

        result = yield request
          .post('/groups')
          .send({
            name: 'test group 3',
            queue: 'test',
            group: {
              type: 'command',
              _id: result.body._id
            }
          })
          .auth(admin.username, admin.password)
          .expect(201);

        group = result.body;
      });

      it('should update single group', function * () {
        yield request
          .patch('/groups/' + group._id)
          .send({
            name: 'updated',
            group: {
              type: 'serial',
              groups: [{
                type: 'command',
                _id: group._id
              }, {
                type: 'command',
                _id: group._id
              }]
            }
          })
          .auth(admin.username, admin.password)
          .expect(200);

        let dbGroup = yield Group.findById(group._id).exec();
        expect(dbGroup.name).to.equal('updated');
        expect(dbGroup.queue).to.equal('test');
        expect(dbGroup.group.type).to.equal('serial');
      });
  */
  });
});
