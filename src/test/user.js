/* globals User */
import {expect} from 'chai';

describe('User Model', function() {
  this.timeout(10000);

  describe('Given correct credentials', function() {
    it('should return true', function* () {
      let userInfo = {
        username: 'test_user_1',
        password: '123456Seven'
      };
      let user = new User(userInfo);

      yield user.save();

      yield User.verifyCredentials(userInfo);
    });
  });

  describe('Given incorrect credentials', function() {
    it('should return INVALID_USERNAME', function* () {
      let userInfo = {
        username: 'test_user_2',
        password: '123456Seven'
      };
      let user = new User(userInfo);

      yield user.save();

      try {
        yield User.verifyCredentials({
          username: 'test_user_02',
          password: '123456Seven'
        });
      } catch (err) {
        expect(err.code, 'INVALID_USERNAME');
      }
    });

    it('should return INVALID_PASSWORD', function* () {
      let userInfo = {
        username: 'test_user_3',
        password: '123456Seven'
      };
      let user = new User(userInfo);

      yield user.save();

      try {
        yield User.verifyCredentials({
          username: 'test_user_3',
          password: '123456Eight'
        });
      } catch (err) {
        expect(err.code, 'INVALID_PASSWORD');
      }
    });
  });
});
