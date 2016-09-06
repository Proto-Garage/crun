/* globals AppError */
import debug from 'debug';

let logger = debug('http');

let statusCodes = {
  UNAUTHORIZED: 401,
  INVALID_USERNAME: 403,
  INVALID_PASSWORD: 403,
  INVALID_ROLE_OPERATION: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403
};

export default [
  function * httpLogger(next) {
    let request = {
      method: this.request.method,
      url: this.request.originalUrl,
      headers: this.request.headers
    };
    if (this.request.body) {
      request.body = this.request.body;
    }
    logger('request', request);
    yield next;
    let response = {
      method: this.request.method,
      url: this.request.originalUrl,
      headers: this.headers,
      status: this.status
    };
    if (this.body) {
      response.body = this.body;
    }
    logger('response', response);
  },
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
  },
  function * setBaseUrl(next) {
    this.baseUrl = process.env.BASE_URL;
    yield next;
  }
];
