export let PageController = {
  index: function* () {
    this.body = `crun ${require('../../package').version}`;
  }
};
