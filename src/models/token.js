import db from '../lib/mongoose';
import {REFRESH_TOKEN_TTL} from '../lib/jwt';
import mongoose from 'mongoose';
import moment from 'moment';

let Schema = mongoose.Schema;

let schema = new Schema({
  jti: {
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
  }
});

schema.statics.cleanUp = function* () {
  yield this
    .model('User')
    .remove({createdAt: {
      $lte: moment(new Date())
        .subtract(REFRESH_TOKEN_TTL, 'milliseconds').toDate()
    }})
    .exec();
};

schema.index({jti: 1}, {unique: true});
schema.index({creator: 1});
schema.index({createdAt: -1});

export let Token = db.model('Token', schema);
