import _ from 'lodash';
import koa from 'koa';
import middlewares from './middlewares';

let app = koa();

_.each(middlewares, middleware => {
  app.use(middleware);
});

app.listen(process.env.HTTP_PORT);
