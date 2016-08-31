/* globals AppError */
import _ from 'lodash';

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
      if (err instanceof AppError) {
        this.body = err.toObject();
        this.status = statusCodes[err.code] || 400;
        if (err.code === 'UNAUTHORIZED') {
          this.set('WWW-Authenticate', 'Basic realm="Login"');
        }
      } else if (err.name === 'ValidationError') {
        this.status = 400;
        this.body = {
          code: 'INVALID_REQUEST',
          message: err.message,
          errors: err.errors
        };
      } else {
        this.body = {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message
        };
        this.status = 500;
      }
    }
  }
];
