import _ from 'lodash';
import mongoose from 'mongoose';

/**
 * Check if object is a valid execution group
 */
export function isValidGroup(group) {
  if (!group.type) {
    throw new Error('`type` is undefined');
  }
  if (!_.includes(['serial', 'parallel', 'command'], group.type)) {
    throw new Error(`\`${group.type}\` is not a valid type`);
  }
  if (group.type === 'command') {
    if (!group._id) {
      throw new Error('`_id` is undefined');
    }
    if (!mongoose.Types.ObjectId.isValid(group._id)) {
      throw new Error(`\`${group._id}\` is not a valid ObjectId`);
    }
  } else {
    if (!group.groups) {
      throw new Error('`groups` is undefined');
    }
    if (!_.isArray(group.groups)) {
      throw new Error('`groups` should be an array');
    }
    _.each(group.groups, item => {
      isValidGroup(item);
    });
  }
}

/**
 * Extract command ids
 */
export function extractCommands(group) {
  if (group.type === 'command') {
    return [group._id];
  }

  let accum = [];
  for (let g of group.groups) {
    accum = accum.concat(extractCommands(g));
  }
  return accum;
}
