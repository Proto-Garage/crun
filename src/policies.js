export default {
  RoleController: {
    create: ['validCredentials'],
    find: ['validCredentials']
  },
  UserController: {
    find: ['validCredentials']
  },
  CommandController: {
    create: ['validCredentials']
  }
};
