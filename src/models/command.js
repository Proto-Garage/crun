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
  cwd: String,
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'STOPPED', 'FAILED', 'SUCCEEDED'],
    default: 'PENDING'
  }
});

export let Command = db.model('Command', schema);
