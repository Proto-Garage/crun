/* globals User */
import _ from 'lodash';
import koa from 'koa';
import middlewares from './middlewares';
import * as Util from './utilities';
import debug from 'debug';
import routes from './routes';
import co from 'co';
import bootloaders from './bootloaders';

let logger = debug('boot');
let router = require('koa-router')();

logger('Loading utilities.');
global.Util = Util;

_.merge(global, require('./error'));

let app = koa();
global.app = {};

global.app.started = co(function * () {
  for (let bootloader of bootloaders) {
    yield bootloader;
  }

  logger('Loading models.');
  Util.dynamicRequire('./models');

  logger('Loading controllers.');
  Util.dynamicRequire('./controllers');

  logger('Loading middlewares.');
  _.each(middlewares, middleware => {
    app.use(middleware);
  });

  logger('Attaching routes.');
  _.each(routes, (value, key) => {
    let handler = _.get(global, value);
    if (!handler) throw new Error(`${value} does not exist.`);

    let match = key.match(/^(GET|POST|DELETE|PUT|DELETE) (.+)$/);
    let method = match[1].toLowerCase();
    let path = match[2];
    router[method](path, function * (next) {
      yield handler.call(this);
      yield next;
    });
  });

  logger('Initializing admin account.');
  let admin = yield User.findOne({username: process.env.ADMIN_USERNAME});
  if (admin) {
    yield admin.update({
      password: yield Util.bcryptHash(process.env.ADMIN_PASSWORD)
    }).exec();
  } else {
    admin = new User({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    });
    yield admin.save();
  }

  app
    .use(router.routes())
    .use(router.allowedMethods());

  yield new Promise(function(resolve) {
    global.app.server = app.listen(process.env.HTTP_PORT, resolve);
  });
  logger(`Server bound to port ${process.env.HTTP_PORT}.`);
});

global.app.started.catch(function(err) {
  console.error(err);
});

