import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword } from './api/resource';
import { PolicyStatement, PolicyDocument, ManagedPolicy } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  data,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
});

// Create a policy for Cognito user management
const cognitoUserManagementPolicy = new ManagedPolicy(backend.auth.resources.userPool, 'CognitoUserManagementPolicy', {
  document: new PolicyDocument({
    statements: [
      new PolicyStatement({
        actions: [
          'cognito-idp:ListUsers',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:AdminDeleteUser',
          'cognito-idp:AdminSetUserPassword',
          'cognito-idp:AdminEnableUser',
          'cognito-idp:AdminDisableUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:ListGroups',
          'cognito-idp:GetGroup',
          'cognito-idp:DescribeUserPool',
        ],
        resources: [backend.auth.resources.userPool.userPoolArn],
      })
    ]
  })
});

// Attach the policy to the admin group role
backend.auth.resources.groups["admin"].role.addManagedPolicy(cognitoUserManagementPolicy);
