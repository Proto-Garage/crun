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

  this.user = yield User.verifyCredentials({
    username: match[1],
    password: match[2]
  });

  yield next;
};
