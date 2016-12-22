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
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  roles: [{type: Schema.Types.ObjectId, ref: 'Role'}]
});

schema.pre('save', function(next) {
  let self = this;
  co(function * () {
    self.rawPassword = self.password;
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
      'UNAUTHORIZED',
      `Invalid username or password.`
    );
  }

  let validPassword = yield Util
    .bcryptCompare(credentials.password, user.password);

  if (!validPassword) {
    throw new AppError(
      'UNAUTHORIZED',
      `Invalid username or password.`
    );
  }

  return user;
};

schema.index({username: 1}, {unique: true});
schema.index({creator: 1});
schema.index({createdAt: -1});

export let User = db.model('User', schema);
