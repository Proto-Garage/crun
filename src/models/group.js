import db from '../lib/mongoose';
import mongoose from 'mongoose';
import {Command} from '../models/command';

let Schema = mongoose.Schema;

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
  executionType: {
    type: String,
    enum: ['series', 'parallel'],
    default: 'series'
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'GroupMember',
    required: true
  }],
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

export let Group = db.model('Group', groupSchema);

class GroupMemberSchema extends Schema {
  constructor(args) {
    super(args, {discriminatorKey: 'type'});

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
    required: true,
    validate: {
      validator: function(id, callback) {
        Group.findOne(id, function(err, group) {
          if (err) {
            return callback(false);
          }
          callback(group !== null);
        });
      },
      message: '{VALUE} group does not exist'
    }
  }
});
let groupMemberCommandSchema = new GroupMemberSchema({
  command: {
    type: Schema.Types.ObjectId,
    ref: 'Command',
    required: true,
    validate: {
      validator: function(id, callback) {
        Command.findOne(id, function(err, command) {
          if (err) {
            return callback(false);
          }
          callback(command !== null);
        });
      },
      message: '{VALUE} command does not exist'
    }
  }
});

export let GroupMember = db.model('GroupMember', groupMemberSchema);
export let GroupMemberGroup = GroupMember.discriminator('group',
  groupMemberGroupSchema);
export let GroupMemberCommand = GroupMember.discriminator('command',
  groupMemberCommandSchema);
