/* globals APIError */

export default [
  function * handleErrors(next) {
    try {
      yield next;
    } catch (err) {
      if (err instanceof APIError) {
        this.body = err.toObject();
        this.status = err.status;
      } else {
        this.body = {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message
        };
        this.status = 500;
      }
    }
  }
];
