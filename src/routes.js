export default {
  'GET /': 'PageController.index',
  'GET /users': 'UserController.find',
  'GET /roles': 'RoleController.find',
  'POST /roles': 'RoleController.create',
  'POST /commands': 'CommandController.create'
};
