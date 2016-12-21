import db from '../lib/mongoose';
import mongoose from 'mongoose';

let Schema = mongoose.Schema;

class GroupMemberSchema extends Schema {
  constructor() {
    super(arguments);

    this.add({
      enabled: {
        type: Boolean,
        default: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    });
  }
}

let groupMemberSchema = new GroupMemberSchema();
let groupMemberGroupSchema = new GroupMemberSchema({
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  }
});
let groupMemberCommandSchema = new GroupMemberSchema({
  command: {
    type: Schema.Types.ObjectId,
    ref: 'Command',
    required: true
  }
});

let groupSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  members: {
    type: Schema.Types.ObjectId,
    ref: 'GroupMember',
    required: true
  },
  queue: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

groupSchema.index({queue: 1});
groupSchema.index({creator: 1});
groupSchema.index({enabled: 1});
groupSchema.index({createdAt: -1});
groupSchema.index({name: 1});

export let GroupMember = db.model('GroupMember', groupMemberSchema);
export let GroupMemberGroup = GroupMember.discriminator('GroupMemberGroup',
  groupMemberGroupSchema);
export let GroupMemberCommand = GroupMember.discriminator('GroupMemberCommand',
  groupMemberCommandSchema);
export let Group = db.model('Group', groupSchema);
