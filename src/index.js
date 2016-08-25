import _ from 'lodash';
import koa from 'koa';
import middlewares from './middlewares';
import * as Util from './utilities';
import debug from 'debug';
import routes from './routes';
import co from 'co';

let logger = debug('boot');
let router = require('koa-router')();

logger('Loading utilities.');
global.Util = Util;

let app = koa();

_.merge(global, require('./error'));

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

app
  .use(router.routes())
  .use(router.allowedMethods());

global.CRUN = {};

global.CRUN.started = co(function * () {
  yield new Promise(function(resolve) {
    global.CRUN.server = app.listen(process.env.HTTP_PORT, resolve);
  });
  logger(`Server bound to port ${process.env.HTTP_PORT}.`);
});
