import db from '../lib/mongoose';
import mongoose from 'mongoose';

let Schema = mongoose.Schema;

let schema = new Schema({
  name: {
    type: String,
    required: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {},
  queue: {
    type: String,
    required: true
  },
  createdAt: Date
});

schema.pre('save', function(next) {
  this.createdAt = new Date();
  next();
});

schema.index({queue: 1});
schema.index({creator: 1});
schema.index({createdAt: -1});
schema.index({name: 1});

export let Group = db.model('Group', schema);
