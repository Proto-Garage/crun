/* globals User, Token, AppError */
import {v4 as uuid} from 'uuid';
import jwt from 'jwt-simple';
import {JWT_SECRET, REFRESH_TOKEN_TTL, ACCESS_TOKEN_TTL} from '../lib/jwt';

export let AuthenticationController = {
  refreshToken: function* () {
    let refreshToken = this.request.body.refreshToken;

    if (!refreshToken) {
      throw new AppError('INVALID_REQUEST', `'refreshToken' is not specified.`);
    }

    let payload;
    try {
      payload = jwt.decode(refreshToken, JWT_SECRET);
    } catch (err) {
      throw new AppError('INVALID_REQUEST',
        `${refreshToken} is not a valid refresh token.`);
    }

    if (payload.exp - Date.now() / 1000 < 0) {
      throw new AppError('INVALID_REQUEST',
        `${refreshToken} is expired.`);
    }

    let token = yield Token
      .findOne({jti: payload.jti, creator: payload.user})
      .exec();

    if (!token) {
      throw new AppError('INVALID_REQUEST',
        `${refreshToken} is expired.`);
    }

    let user = yield User
      .findOne({_id: payload.user})
      .exec();

    if (!user) {
      throw new AppError('INVALID_REQUEST',
        `${payload.user} user does not exist.`);
    }

    let now = new Date();
    let accessToken = jwt.encode({
      type: 'access',
      iss: 'CRUN',
      user: user._id,
      iat: Math.round(now.getTime() / 1000),
      exp: Math.round((now.getTime() + ACCESS_TOKEN_TTL) / 1000)
    }, JWT_SECRET, 'HS512');

    this.body = {
      accessToken
    };
  },
  authenticate: function* () {
    let user = yield User.verifyCredentials(this.request.body);

    let token = new Token({
      jti: uuid(),
      creator: user
    });
    yield token.save();

    let now = new Date();
    let refreshToken = jwt.encode({
      type: 'refresh',
      iss: 'CRUN',
      jti: token.jti,
      user: user._id,
      iat: Math.round(now.getTime() / 1000),
      exp: Math.round((now.getTime() + REFRESH_TOKEN_TTL) / 1000)
    }, JWT_SECRET, 'HS512');

    let accessToken = jwt.encode({
      type: 'access',
      iss: 'CRUN',
      user: user._id,
      iat: Math.round(now.getTime() / 1000),
      exp: Math.round((now.getTime() + ACCESS_TOKEN_TTL) / 1000)
    }, JWT_SECRET, 'HS512');

    this.body = {
      refreshToken,
      accessToken
    };
  }
};
