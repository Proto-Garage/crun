/* globals AppError */
import mongoose from 'mongoose';

let ObjectId = mongoose.Types.ObjectId;
export let validObjectId = function * (next) {
  if (this.params.id) {
    if (!ObjectId.isValid(this.params.id)) {
      throw new AppError('NOT_FOUND',
        `${this.params.id} does not exist.`);
    }
  }

  yield next;
};
