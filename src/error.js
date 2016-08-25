import _ from 'lodash';

export class APIError extends Error {
  constructor(code, message, metadata, status) {
    super(message);

    this.code = code;
    this.metadata = metadata;
    this.status = status || 400;
  }

  toObject() {
    return _.merge({
      code: this.code,
      message: this.message
    }, this.metadata);
  }
}
