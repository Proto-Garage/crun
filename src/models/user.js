/* globals Util, AppError */
import db from '../lib/mongoose';
import mongoose from 'mongoose';
import co from 'co';
import {v1 as uid} from 'node-uuid';

let Schema = mongoose.Schema;

let schema = new Schema({
  uid: String,
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

schema.pre('save', function(next) {
  let self = this;

  if (!this.uid) {
    this.uid = uid();
  }
  co(function * () {
    self.password = yield Util.bcryptHash(self.password);
  }).then(next).catch(next);
});

schema.statics.verifyCredentials = function * (credentials) {
  let user = yield this
    .model('User')
    .findOne({username: credentials.username})
    .exec();

  if (!user) {
    throw new AppError(
      'INVALID_USERNAME',
      `${credentials.username} username is invalid.`
    );
  }

  let validPassword = yield Util
    .bcryptCompare(credentials.password, user.password);

  if (!validPassword) {
    throw new AppError(
      'INVALID_PASSWORD',
      `${credentials.password} password is invalid.`
    );
  }

  return true;
};

schema.index({uid: 1}, {unique: true});
schema.index({username: 1}, {unique: true});

export let User = db.model('User', schema);
