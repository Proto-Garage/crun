/* globals AppError, User */
export let validCredentials = function * (next) {
  if (!this.request.headers.authorization) {
    throw new AppError('UNAUTHORIZED', 'Unauthorized.');
  }

  let match = this.request.headers.authorization.match(/^Basic (.+)$/);
  if (!match) {
    throw new AppError('UNAUTHORIZED', 'Unauthorized.');
  }
  let auth = new Buffer(match[1], 'base64').toString();
  match = auth.match(/^(.+):(.+)$/);
  if (!match) {
    throw new AppError('UNAUTHORIZED', 'Unauthorized.');
  }

  this.credentials = {
    username: match[1],
    password: match[2]
  };

  this.user = yield User.verifyCredentials(this.credentials);

  let baseUrl = process.env.BASE_URL.split('://');
  this.baseUrl = [
    baseUrl[0],
    '://',
    `${this.credentials.username}:${this.credentials.password}@`,
    baseUrl[1]
  ].join('');

  yield next;
};
