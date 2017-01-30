/* globals User, Role, Policies */
import 'babel-polyfill';
import _ from 'lodash';
import koa from 'koa';
import * as Util from './utilities';
import debug from 'debug';
import routes from './routes';
import co from 'co';
import bootloaders from './bootloaders';
import json from 'koa-json';
import compose from 'koa-compose';
import bodyParser from 'koa-bodyparser';
import Promise from 'bluebird';

const mkdir = Promise.promisify(require('fs').mkdir);

let logger = debug('boot');
let router = require('koa-router')();

logger('Loading utilities.');
global.Util = Util;

_.merge(global, require('./error'));

let app = koa();

global.app = {};

global.app.started = co(function* () {
  app.use(json({pretty: false, param: 'pretty'}));
  app.use(bodyParser());

  for (let bootloader of bootloaders) {
    yield bootloader;
  }

  logger('Loading models.');
  Util.dynamicRequire('./models');

  logger('Loading controllers.');
  Util.dynamicRequire('./controllers');

  logger('Loading middlewares.');
  let middlewares = require('./middlewares').default;
  _.each(middlewares, middleware => {
    app.use(middleware);
  });

  logger('Loading policies.');
  Util.dynamicRequire('./policies', 'Policies');
  let policies = require('./policies').default;

  logger('Attaching routes.');
  _.each(routes, (value, key) => {
    logger('route', key);
    let stack = [];
    let handler = _.get(global, value);
    if (!handler) throw new Error(`${value} does not exist.`);
    let policyList = _.get(policies, value);
    if (policyList) {
      _.each(policyList, policy => {
        if (Policies[policy]) {
          stack.push(Policies[policy]);
        }
      });
    }
    let match = key.match(/^(GET|POST|DELETE|PUT|PATCH) (.+)$/);
    let method = match[1].toLowerCase();
    let path = match[2];
    stack.push(function* (next) {
      yield handler.call(this);
      yield next;
    });
    router[method](path, compose(stack));
  });

  logger('Initializing admin account.');
  let role = yield Role.findOneAndUpdate({name: 'superuser'}, {
    permissions: [
      {operation: 'CREATE_USER'},
      {operation: 'CREATE_ROLE'},
      {operation: 'CREATE_COMMAND'},
      {operation: 'CREATE_GROUP'},
      {operation: 'EXECUTE_GROUP'}
    ]
  }, {upsert: true, new: true}).exec();

  let admin = yield User.findOne({admin: true}).exec();

  if (admin) {
    yield admin.update({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    }).exec();
  } else {
    let admin = new User({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      roles: [role],
      admin: true
    });
    yield admin.save();
  }

  try {
    yield mkdir(process.env.COMMAND_LOGS_DIR, 0o755);
  } catch(err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
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
  console.error(err, err.stack);
});
