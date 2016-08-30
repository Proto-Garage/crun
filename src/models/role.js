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
  operations: [{
    name: {
      type: String,
      required: true
    }
  }]
});

schema.pre('save', function(next) {
  console.log(this);
  if (!this.uid) {
    this.uid = uid();
  }
  next();
});

schema.index({uid: 1}, {unique: true});
schema.index({name: 1}, {unique: true});

export let User = db.model('Role', schema);
