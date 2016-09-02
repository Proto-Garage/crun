import db from '../lib/mongoose';
import mongoose from 'mongoose';

let Schema = mongoose.Schema;

let schema = new Schema({
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: Date,
  status: {}
});

schema.pre('save', function(next) {
  this.createdAt = new Date();
  next();
});

schema.index({status: {status: 1}});
schema.index({creator: 1});
schema.index({createdAt: -1});
schema.index({group: 1});

export let Execution = db.model('Execution', schema);
