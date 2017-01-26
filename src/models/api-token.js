import db from '../lib/mongoose';
import mongoose from 'mongoose';
import crypto from 'crypto';

let Schema = mongoose.Schema;

let schema = new Schema({
  token: {
    type: String,
    required: true,
    match: /^[a-f0-9]{32}$/,
    default: () => crypto.randomBytes(16).toString('hex')
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

schema.index({token: 1}, {unique: true});
schema.index({creator: 1});
schema.index({owner: 1});
schema.index({createdAt: -1});

export let APIToken = db.model('APIToken', schema);
