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
  operations: [{
    name: {
      type: String,
      required: true
    }
  }]
});

schema.index({name: 1}, {unique: true});

export let Role = db.model('Role', schema);
