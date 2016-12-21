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
    ref: 'User'
  },
  permissions: [{
    operation: {
      type: String,
      required: true
    },
    user: String,
    role: String,
    command: String,
    group: String
  }],
  createdAt: Date
});

schema.pre('save', function(next) {
  this.createdAt = new Date();
  next();
});
schema.index({name: 1});
schema.index({creator: 1});
schema.index({createdAt: -1});
schema.index({'permissions.operation': 1});

export let Role = db.model('Role', schema);
