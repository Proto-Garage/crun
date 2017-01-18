import db from '../lib/mongoose';
import mongoose from 'mongoose';

let Schema = mongoose.Schema;

let permissionSchema = new Schema({
  operation: {
    type: String,
    required: true
  },
  scope: {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role'
    },
    command: {
      type: Schema.Types.ObjectId,
      ref: 'Command'
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group'
    }
  }
}, {_id: false});

let schema = new Schema({
  name: {
    type: String,
    required: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  permissions: [permissionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

schema.index({name: 1});
schema.index({creator: 1});
schema.index({createdAt: -1});
schema.index({'permissions.operation': 1});

export let Role = db.model('Role', schema);
