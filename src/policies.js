export default {
  RoleController: {
    create: ['validCredentials', 'canCreateRole'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId'],
    remove: ['validCredentials', 'validObjectId'],
    update: ['validCredentials', 'validObjectId']
  },
  UserController: {
    create: ['validCredentials', 'canCreateUser'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId'],
    remove: ['validCredentials', 'validObjectId'],
    update: ['validCredentials', 'validObjectId']
  },
  CommandController: {
    create: ['validCredentials', 'canCreateCommand'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId'],
    remove: ['validCredentials', 'validObjectId'],
    update: ['validCredentials', 'validObjectId']
  },
  GroupController: {
    create: ['validCredentials', 'canCreateGroup'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId'],
    remove: ['validCredentials', 'validObjectId'],
    update: ['validCredentials', 'validObjectId']
  },
  ExecutionController: {
    create: ['validCredentials', 'canExecuteGroup'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId']
  }
};
