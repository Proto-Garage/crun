export default {
  RoleController: {
    create: ['validCredentials'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId'],
    remove: ['validCredentials', 'validObjectId']
  },
  // RoleController: {
  //   create: ['validCredentials', 'canCreateRole'],
  //   find: ['validCredentials', 'canFindRole'],
  //   findOne: ['validCredentials', 'validObjectId', 'canFindSingleRole'],
  //   remove: ['validCredentials', 'validObjectId', 'canRemoveUser']
  // },
  UserController: {
    create: ['validCredentials', 'canCreateUser'],
    find: ['validCredentials', 'canFindUser'],
    findOne: ['validCredentials', 'validObjectId', 'canFindUser'],
    remove: ['validCredentials', 'validObjectId'],
    update: ['validCredentials', 'validObjectId', 'canUpdateUser']
  },
  CommandController: {
    create: ['validCredentials'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId'],
    remove: ['validCredentials', 'validObjectId'],
    update: ['validCredentials', 'validObjectId']
  },
  // CommandController: {
  //   create: ['validCredentials', 'canCreateCommand'],
  //   find: ['validCredentials', 'canFindCommand'],
  //   findOne: ['validCredentials', 'validObjectId', 'canFindSingleCommand'],
  //   remove: ['validCredentials', 'validObjectId', 'canRemoveCommand'],
  //   update: ['validCredentials', 'validObjectId', 'canUpdateCommand']
  // },
  GroupController: {
    create: ['validCredentials', 'canCreateGroup'],
    find: ['validCredentials', 'canFindGroup'],
    findOne: ['validCredentials', 'validObjectId', 'canFindSingleGroup'],
    remove: ['validCredentials', 'validObjectId', 'canRemoveGroup'],
    update: ['validCredentials', 'validObjectId', 'canUpdateGroup']
  },
  ExecutionController: {
    create: ['validCredentials', 'canExecuteGroup'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId']
  }
};
