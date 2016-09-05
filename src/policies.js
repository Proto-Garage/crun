export default {
  RoleController: {
    create: ['validCredentials', 'canCreateRole'],
    find: ['validCredentials', 'canFindRole'],
    findOne: ['validCredentials', 'validObjectId', 'canFindSingleRole'],
    remove: ['validCredentials', 'validObjectId', 'canRemoveUser']
  },
  UserController: {
    create: ['validCredentials', 'canCreateUser'],
    find: ['validCredentials', 'canFindUser'],
    findOne: ['validCredentials', 'validObjectId', 'canFindSingleUser'],
    remove: ['validCredentials', 'validObjectId', 'canRemoveUser'],
    update: ['validCredentials', 'validObjectId', 'canUpdateUser']
  },
  CommandController: {
    create: ['validCredentials', 'canCreateCommand'],
    find: ['validCredentials', 'canFindCommand'],
    findOne: ['validCredentials', 'validObjectId', 'canFindSingleCommand'],
    remove: ['validCredentials', 'validObjectId', 'canRemoveCommand']
  },
  GroupController: {
    create: ['validCredentials', 'canCreateGroup'],
    find: ['validCredentials', 'canFindGroup'],
    findOne: ['validCredentials', 'validObjectId', 'canFindSingleGroup'],
    remove: ['validCredentials', 'validObjectId', 'canRemoveGroup']
  },
  ExecutionController: {
    create: ['validCredentials', 'canExecuteGroup'],
    find: ['validCredentials'],
    findOne: ['validCredentials', 'validObjectId']
  }
};
