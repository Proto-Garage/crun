import db from '../lib/mongoose';
import mongoose from 'mongoose';
import {v1 as uid} from 'node-uuid';

let Schema = mongoose.Schema;

let schema = new Schema({
  uid: String,
  name: {
    type: String,
    required: true
  },
  command: {
    type: String,
    required: true
  },
  cwd: String
});

schema.pre('save', function(next) {
  if (!this.uid) {
    this.uid = uid();
  }
  next();
});

schema.index({role: 1}, {unique: true});

export let User = db.model('Command', schema);
