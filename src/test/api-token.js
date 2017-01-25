/* globals app, APIToken, User */
import {expect} from 'chai';
import mongoose from 'mongoose';
import Promise from 'bluebird';
import _ from 'lodash';

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

  describe('Tokens', function() {
    describe('POST /tokens', function() {
      let apiToken;

      after(function* () {
        yield APIToken
          .remove({token: apiToken.token})
          .exec();
      });
      it('should create new token', function* () {
        let result = yield request
          .post('/tokens')
          .auth(admin.username, admin.password)
          .expect(201)
          .expect(res => {
            expect(res.body).to.has.property('uri');
            expect(res.body).to.has.property('_id');
            expect(res.body).to.has.property('token');
          });

        apiToken = yield APIToken
          .findOne({token: result.body.token})
          .exec();
        expect(Boolean(apiToken)).to.equal(true);
      });
    });

    describe('GET /tokens/:id', function() {
      describe('Given an existing token', function() {
        let apiToken;
        before(function* () {
          let user = yield User
            .findOne({username: admin.username})
            .exec();

          apiToken = new APIToken({
            creator: user,
            owner: user
          });
          yield apiToken.save();
        });

        after(function* () {
          yield APIToken
            .remove(apiToken._id)
            .exec();
        });

        it('should retrieve token', function* () {
          yield request
            .get('/tokens/' + apiToken._id)
            .auth(admin.username, admin.password)
            .expect(200)
            .expect(res => {
              expect(res.body).to.has.property('links');
              expect(res.body.links).to.has.deep.property('self');
              expect(res.body).to.has.property('data');
              expect(res.body.data).to.has.property('creator');
              expect(res.body.data).to.has.property('owner');
              expect(res.body.data).to.has.property('token');
              expect(res.body.data).to.has.property('createdAt');
            });
        });
      });

      describe('Given a non-existing token', function() {
        it('should return 404', function* () {
          yield request
            .get('/tokens/' + new ObjectId())
            .auth(admin.username, admin.password)
            .expect(404)
            .expect(res => {
              expect(res.body).to.has.property('code', 'NOT_FOUND');
            });
        });
      });
    });

    describe('GET /tokens', function() {
      let apiTokens;
      const NUM_API_TOKENS = 15;
      before(function* () {
        let user = yield User
          .findOne({username: admin.username})
          .exec();

        apiTokens = yield Promise.map(_.range(NUM_API_TOKENS), () => {
          let apiToken = new APIToken({
            owner: user,
            creator: user
          });
          return apiToken.save();
        });
      });

      after(function* () {
        yield Promise.map(apiTokens, apiToken => {
          return apiToken.remove();
        });
      });

      it('should retrieve tokens', function* () {
        yield request
          .get('/tokens')
          .auth(admin.username, admin.password)
          .expect(200)
          .expect(res => {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body.links).to.has.property('next');
            expect(res.body.links).to.has.property('last');
            _.each(res.body.data, item => {
              expect(item).to.has.property('_id');
              expect(item).to.has.property('creator');
              expect(item).to.has.property('owner');
              expect(item).to.has.property('token');
              expect(item).to.has.property('createdAt');
            });
          });
      });

      it('should retrieve tokens', function* () {
        yield request
          .get('/tokens')
          .query({
            skip: 10
          })
          .auth(admin.username, admin.password)
          .expect(200)
          .expect(res => {
            expect(res.body).to.has.property('links');
            expect(res.body.links).to.has.property('self');
            expect(res.body.links).to.has.property('last');
            _.each(res.body.data, item => {
              expect(item).to.has.property('_id');
              expect(item).to.has.property('creator');
              expect(item).to.has.property('owner');
              expect(item).to.has.property('token');
              expect(item).to.has.property('createdAt');
            });
          });
      });
    });

    describe('DELETE /tokens/:id', function() {
      let apiToken;
      before(function* () {
        let user = yield User
          .findOne({username: admin.username})
          .exec();

        apiToken = new APIToken({
          owner: user,
          creator: user
        });
        yield apiToken.save();
      });

      after(function* () {
        yield apiToken.remove();
      });

      describe('Given an existing token', function() {
        it('should remove token', function* () {
          yield request
            .delete('/tokens/' + apiToken._id)
            .auth(admin.username, admin.password)
            .expect(200);
        });
      });

      describe('Given a non-existing token', function() {
        it('should return 404', function* () {
          yield request
            .delete('/tokens/' + new ObjectId())
            .auth(admin.username, admin.password)
            .expect(404)
            .expect(res => {
              expect(res.body).to.has.property('code', 'NOT_FOUND');
            });
        });
      });
    });
  });
});
