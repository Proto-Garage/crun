export let UserController = {
  find: function * () {
    this.body = {
      data: []
    };
    this.status = 200;
  }
};
