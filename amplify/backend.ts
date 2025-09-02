import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword } from './api/admin/resource';
// import { createOrganization, deleteOrganization, getOrganization, inviteUserToOrganization, listOrganizations, updateOrganization } from './api/sigint/Organization.api';
import { OrganizationAPI } from './api/resource';
import { Policy, PolicyStatement, PolicyDocument, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { RestApi, Cors, LambdaIntegration, CognitoUserPoolsAuthorizer, AuthorizationType, MethodOptions } from 'aws-cdk-lib/aws-apigateway';

const backend = defineBackend({
  auth,
  data,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  createOrganization: OrganizationAPI.create,
  deleteOrganization: OrganizationAPI.delete,
  getOrganization: OrganizationAPI.get,
  inviteUserToOrganization: OrganizationAPI.inviteUser,
  listOrganizations: OrganizationAPI.list,
  updateOrganization: OrganizationAPI.update
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

const api = backend.createStack('pulse-sigint=-api');

// APIs
const sigintRest = new RestApi(api, 'SigintRestApi', {
  restApiName: 'Sigint API',
  description: 'API for Pulse Sigint',
  deployOptions: {
    stageName: 'dev',
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});

// Authorizer
const apiAuth = new CognitoUserPoolsAuthorizer(api, 'apiAuth', {
  cognitoUserPools: [backend.auth.resources.userPool]
});

const apiConfig: MethodOptions = {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: apiAuth,

};

// Resource Paths
const organizationPath = sigintRest.root.addResource('organization');

organizationPath.addMethod('POST', new LambdaIntegration(backend.createOrganization.resources.lambda), apiConfig);
organizationPath.addMethod('GET', new LambdaIntegration(backend.getOrganization.resources.lambda), apiConfig);
organizationPath.addMethod('PUT', new LambdaIntegration(backend.updateOrganization.resources.lambda), apiConfig);
organizationPath.addMethod('DELETE', new LambdaIntegration(backend.deleteOrganization.resources.lambda), apiConfig);

// Proxy Paths
organizationPath.addProxy({
  anyMethod: true,
  defaultIntegration: new LambdaIntegration(backend.listOrganizations.resources.lambda),
  defaultMethodOptions: apiConfig
});

const apiRestPolicy = new Policy(api, 'RestApiPolicy', {
  statements: [
    new PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [
        sigintRest.arnForExecuteApi()
      ]
    })
  ]
});