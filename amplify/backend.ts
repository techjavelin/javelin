import { defineBackend } from '@aws-amplify/backend';
// Data migrations framework
import { runMigrations } from './data/migrations/runner';
import { latestMigrationId } from './data/migrations';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword, inviteAdminUser, activateOrganizationAdmin, runMigrations as runMigrationsFn, listMigrations } from './api/admin/resource';
import { updateUserProfileSecure, deleteUserProfileSecure } from './api/profile/resource';
import { health } from './api/health/resource';
import { storage } from './storage/resource';
// import { createOrganization, deleteOrganization, getOrganization, inviteUserToOrganization, listOrganizations, updateOrganization } from './api/sigint/Organization.api';
import { OrganizationAPI } from './api/resource';
import { Policy, PolicyStatement, PolicyDocument, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { RestApi, Cors, LambdaIntegration, CognitoUserPoolsAuthorizer, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import type { MethodOptions } from 'aws-cdk-lib/aws-apigateway';
import { Stack } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  inviteAdminUser,
  activateOrganizationAdmin,
  runMigrations: runMigrationsFn,
  listMigrations,
  updateUserProfileSecure,
  deleteUserProfileSecure,
  health,
  createOrganization: OrganizationAPI.create,
  // deleteOrganization: OrganizationAPI.delete,
  // getOrganization: OrganizationAPI.get,
  // inviteUserToOrganization: OrganizationAPI.inviteUser,
  // listOrganizations: OrganizationAPI.list,
  // updateOrganization: OrganizationAPI.update
});

// Apply pending data migrations (during synth we allow skipping if config not ready)
runMigrations({ skipOnConfigError: true }).catch(e => {
  // eslint-disable-next-line no-console
  console.error('[migrations] Error applying migrations', e);
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
// Separate stack for migration infrastructure (DynamoDB state table)
const migrationsInfra = backend.createStack('migrations');

// Table design:
//  pk = 'lock' (single item used for optimistic locking via conditional put)
//  pk = 'migration#<id>' items recording applied migrations when using the Dynamo adapter
//  Attributes stored (besides pk): name, appliedAt (ISO), checksum
// Pay-per-request billing to avoid capacity management. No TTL required.
const migrationStateTable = new Table(migrationsInfra, 'MigrationStateTable', {
  partitionKey: { name: 'pk', type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST
});

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

// Admin user invite & activation endpoints (POST). CORS preflight handled by RestApi defaultCorsPreflightOptions
const invitePath = sigintRest.root.addResource('invite-admin-user');
invitePath.addMethod('POST', new LambdaIntegration(backend.inviteAdminUser.resources.lambda), {
  // Invitation should be allowed without auth if design requires; currently enforce Cognito (adjust if needed)
  ...apiConfig
});

const activatePath = sigintRest.root.addResource('activate-organization-admin');
activatePath.addMethod('POST', new LambdaIntegration(backend.activateOrganizationAdmin.resources.lambda), {
  ...apiConfig
});

// Public health endpoint (no auth) for diagnostics & CORS validation
const healthPath = sigintRest.root.addResource('health');
healthPath.addMethod('GET', new LambdaIntegration(backend.health.resources.lambda), {
  authorizationType: AuthorizationType.NONE
});

// Admin-only run-migrations endpoint (POST)
const runMigrationsPath = sigintRest.root.addResource('run-migrations');
runMigrationsPath.addMethod('POST', new LambdaIntegration(backend.runMigrations.resources.lambda), apiConfig);
const listMigrationsPath = sigintRest.root.addResource('migrations-state');
listMigrationsPath.addMethod('GET', new LambdaIntegration(backend.listMigrations.resources.lambda), apiConfig);

// Grant Dynamo table access (read/write) to the migrations lambda
migrationStateTable.grantReadWriteData(backend.runMigrations.resources.lambda);
migrationStateTable.grantReadData(backend.listMigrations.resources.lambda);
// organizationPath.addMethod('GET', new LambdaIntegration(backend.getOrganization.resources.lambda), apiConfig);
// organizationPath.addMethod('PUT', new LambdaIntegration(backend.updateOrganization.resources.lambda), apiConfig);
// organizationPath.addMethod('DELETE', new LambdaIntegration(backend.deleteOrganization.resources.lambda), apiConfig);

// Proxy Paths
// organizationPath.addProxy({
//   anyMethod: true,
//   defaultIntegration: new LambdaIntegration(backend.listOrganizations.resources.lambda),
//   defaultMethodOptions: apiConfig
// });

// API Policy
const apiRestPolicy = new Policy(api, 'RestApiPolicy', {
  statements: [
    new PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [
        sigintRest.arnForExecuteApi('*', '/*', '*')
      ]
    })
  ]
});

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);

backend.addOutput({
  custom: {
    API: {
      [sigintRest.restApiName]: {
        endpoint: sigintRest.url,
        region: Stack.of(api).region,
        apiName: sigintRest.restApiName
      }
    },
    GRAPHQL: {
      endpoint: (data as any).resources?.graphql?.url ?? 'https://cct4ibicz5f3piqqte3kaiwlce.appsync-api.us-east-1.amazonaws.com/graphql',
      region: Stack.of(api).region
    },
    MIGRATIONS: {
      latest: latestMigrationId,
      stateTableName: migrationStateTable.tableName
    }
  }
});

