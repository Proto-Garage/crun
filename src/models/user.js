/* globals Util, AppError */
import db from '../lib/mongoose';
import mongoose from 'mongoose';
import co from 'co';

let Schema = mongoose.Schema;

let schema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  roles: [{type: Schema.Types.ObjectId, ref: 'Role'}]
});

schema.pre('save', function(next) {
  let self = this;

  co(function * () {
    self.password = yield Util.bcryptHash(self.password);
  }).then(next).catch(next);
});

schema.statics.verifyCredentials = function * (credentials) {
  let user = yield this
    .model('User')
    .findOne({username: credentials.username})
    .populate('roles')
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

  return user;
};

schema.index({username: 1}, {unique: true});

export let User = db.model('User', schema);
