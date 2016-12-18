/* globals User */
export let AuthenticationController = {
  authenticate: function * () {
    yield User.verifyCredentials(this.request.body);

    this.body = {
      refresh: 'refresh',
      access: 'access'
    };
  }
};
