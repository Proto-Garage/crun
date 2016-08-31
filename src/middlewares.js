/* globals AppError */
import _ from 'lodash';
import parse from 'co-body';

let statusCodes = {
  UNAUTHORIZED: 401,
  INVALID_USERNAME: 403,
  INVALID_PASSWORD: 403,
  INVALID_ROLE_OPERATION: 400
};

export default [
  function * handleErrors(next) {
    try {
      yield next;
    } catch (err) {
      console.error(err);
      if (err instanceof AppError) {
        this.body = err.toObject();
        this.status = statusCodes[err.code] || 400;
        if (err.code === 'UNAUTHORIZED') {
          this.set('WWW-Authenticate', 'Basic realm="Login"');
        }
      } else {
        this.body = {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message
        };
        this.status = 500;
      }
    }
  },
  function * parseBody(next) {
    if (_.includes(['POST', 'PUT'], this.request.method)) {
      let body = yield parse(this.req);
      this.request.body = body;
    }
    yield next;
  }
];
