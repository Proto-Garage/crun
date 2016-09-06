import db from '../lib/mongoose';
import mongoose from 'mongoose';

let Schema = mongoose.Schema;

let schema = new Schema({
  name: {
    type: String,
    required: true
  },
  command: {
    type: String,
    required: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cwd: String,
  env: {},
  createdAt: Date,
  timeout: {
    type: Number,
    default: 180000
  }
});

schema.pre('save', function(next) {
  this.createdAt = new Date();
  next();
});

schema.index({creator: 1});
schema.index({createdAt: -1});
schema.index({name: 1});

export let Command = db.model('Command', schema);
