export default {
  'GET /': 'PageController.index',
  'POST /authenticate': 'AuthenticationController.authenticate',
  'POST /refreshToken': 'AuthenticationController.refreshToken',
  'POST /tokens': 'APITokenController.create',
  'POST /users/:id/tokens': 'APITokenController.create',
  'GET /tokens/:id': 'APITokenController.findOne',
  'GET /tokens': 'APITokenController.find',
  'DELETE /tokens/:id': 'APITokenController.remove',
  'GET /users': 'UserController.find',
  'GET /users/:id': 'UserController.findOne',
  'DELETE /users/:id': 'UserController.remove',
  'PATCH /users/:id': 'UserController.update',
  'POST /users': 'UserController.create',
  'GET /roles': 'RoleController.find',
  'POST /roles': 'RoleController.create',
  'GET /roles/:id': 'RoleController.findOne',
  'DELETE /roles/:id': 'RoleController.remove',
  'POST /commands': 'CommandController.create',
  'GET /commands': 'CommandController.find',
  'GET /commands/:id': 'CommandController.findOne',
  'DELETE /commands/:id': 'CommandController.remove',
  'PATCH /commands/:id': 'CommandController.update',
  'POST /groups': 'GroupController.create',
  'GET /groups': 'GroupController.find',
  'GET /groups/:id': 'GroupController.findOne',
  'DELETE /groups/:id': 'GroupController.remove',
  'PATCH /groups/:id': 'GroupController.update',
  'POST /executions': 'ExecutionController.create',
  'GET /executions/:id': 'ExecutionController.findOne',
  'GET /executions': 'ExecutionController.find',
  'GET /logs/:id': 'LogController.findOne'
};
