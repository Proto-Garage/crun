import _ from 'lodash';

export class AppError extends Error {
  constructor(code, message, metadata = {}) {
    super(message);
    this.code = code;
    this.metadata = metadata;
  }

  toObject() {
    return _.merge({
      code: this.code,
      message: this.message
    }, this.metadata);
  }
}
