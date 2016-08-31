/* globals app, Role */
/* eslint max-nested-callbacks: ["error", 6]*/
import {expect} from 'chai';

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
});
