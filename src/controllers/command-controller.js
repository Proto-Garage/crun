/* globals Command */
import _ from 'lodash';
import url from 'url';

export let CommandController = {
  create: function * () {
    let params = _.pick(this.request.body, [
      'name',
      'command',
      'env',
      'cwd'
    ]);
    params.creator = this.user;

    let command = new Command(params);
    yield command.save();

    this.body = {
      uri: url.resolve(process.env.BASE_URL, '/commands/' + command._id)
    };
    this.status = 201;
  },
  findOne: function * () {

  }
};
