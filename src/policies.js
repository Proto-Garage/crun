export default {
  RoleController: {
    create: ['validCredentials'],
    find: ['validCredentials']
  },
  UserController: {
    find: ['validCredentials']
  },
  CommandController: {
    create: ['validCredentials'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId'],
    remove: ['validCredentials', 'validObjectId']
  },
  GroupController: {
    create: ['validCredentials'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId'],
    remove: ['validCredentials', 'validObjectId']
  }
};
