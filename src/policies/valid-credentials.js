/* globals AppError, User */
import _ from 'lodash';
import jwt from 'jwt-simple';
import {JWT_SECRET} from '../lib/jwt';

export let validCredentials = function* (next) {
  if (!this.request.headers.authorization) {
    throw new AppError('UNAUTHORIZED', 'Unauthorized.');
  }

  let match = this.request.headers
    .authorization.match(/^(Basic|Access|API) (.+)$/);
  if (!match) {
    throw new AppError('UNAUTHORIZED', 'Unauthorized.');
  }

  let realm = _.nth(match, 1);
  let content = _.nth(match, 2);

  this.baseUrl = process.env.BASE_URL;
  if (realm === 'Basic') {
    let auth = new Buffer(content, 'base64').toString();
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
  } else if (realm === 'Access') {
    let payload;

    try {
      payload = jwt.decode(content, JWT_SECRET);
    } catch (err) {
      throw new AppError('UNAUTHORIZED', 'Unauthorized.');
    }

    if (payload.exp - Date.now() / 1000 < 0) {
      throw new AppError('TOKEN_EXPIRED', 'Unauthorized.');
    }

    let user = yield User
      .findOne({_id: payload.user})
      .populate('roles')
      .exec();

    if (!user) {
      throw new AppError('NOT_FOUND', `${payload.user} user no longer exists.`);
    }

    this.user = user;
  }

  this.permissions = _(this.user.roles)
    .map('permissions')
    .flatten()
    .value();

  yield next;
};
