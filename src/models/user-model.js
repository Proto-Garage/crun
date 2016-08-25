/* globals APIError */

import bcrypt from 'bcryptjs';

class User {
  constructor() {
    this._users = require('../../users');
  }

  /**
   * Verify credentials
   * @param {object} params
   * @param {string} params.username
   * @param {string} params.password
   */
  * verifyCredentials(params) {
    if (!this.users[params.username]) {
      throw new APIError(
        'INVALID_USERNAME',
        `${params.username} is invalid.`,
        {}, 401
      );
    }

    let valid = bcrypt.compareSync(
      params.username,
      this._users[params.username]
    );

    if (!valid) {
      throw new APIError(
        'INVALID_PASSWORD',
        `Invalid password.`,
        {}, 401
      );
    }

    return true;
  }
}

export let UserModel = new User();
