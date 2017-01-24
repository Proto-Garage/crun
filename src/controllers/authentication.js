/* globals User, Token */
import {v4 as uuid} from 'uuid';
import jwt from 'jwt-simple';
import {JWT_SECRET, REFRESH_TOKEN_TTL, ACCESS_TOKEN_TTL} from '../lib/jwt';

export let AuthenticationController = {
  authenticate: function * () {
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
