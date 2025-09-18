import { defineBackend } from '@aws-amplify/backend';
// NOTE: Automatic invocation of data migrations during synth has been removed.
// Migrations now run explicitly as the final CI step via `npm run migrate:ci`.
// (See scripts/migrate.ts and amplify.yml for orchestration.)
import { auth } from './auth/resource';
import { data } from './data/resource';
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword, inviteAdminUser, activateOrganizationAdmin, runMigrations as runMigrationsFn, listMigrations, clientLogIngest } from './api/admin/resource';
import { vulnTemplates } from './api/vulnTemplates/resource';
import { userApiKeys } from './api/userApiKeys/resource';
import { updateUserProfileSecure, deleteUserProfileSecure } from './api/profile/resource';
import { health } from './api/health/resource';
import { backupCodes } from './functions/mfa/backupCodes';
import { storage } from './storage/resource';
// import { createOrganization, deleteOrganization, getOrganization, inviteUserToOrganization, listOrganizations, updateOrganization } from './api/sigint/Organization.api';
import { OrganizationAPI } from './api/resource';
import { Policy, PolicyStatement, PolicyDocument, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { RestApi, Cors, LambdaIntegration, CognitoUserPoolsAuthorizer, AuthorizationType, ApiKey, UsagePlan, Period } from 'aws-cdk-lib/aws-apigateway';
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
  clientLogIngest,
  updateUserProfileSecure,
  deleteUserProfileSecure,
  health,
  backupCodes,
  vulnTemplates,
  userApiKeys,
  createOrganization: OrganizationAPI.create,
  // deleteOrganization: OrganizationAPI.delete,
  // getOrganization: OrganizationAPI.get,
  // inviteUserToOrganization: OrganizationAPI.inviteUser,
  // listOrganizations: OrganizationAPI.list,
  // updateOrganization: OrganizationAPI.update
});

// (Intentionally left blank: data migrations are no longer auto-applied at synth time.)

// Create a policy for Cognito user management
// Cast auth resources to any to access underlying CDK constructs (userPool, groups)
const authResources: any = backend.auth.resources as any;
const cognitoUserManagementPolicy = new ManagedPolicy(authResources.userPool, 'CognitoUserManagementPolicy', {
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
authResources.groups["admin"].role.addManagedPolicy(cognitoUserManagementPolicy);

const api = backend.createStack('pulse-sigint-api');
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

// Dedicated API key + usage plan for vulnerability templates endpoints (machine-to-machine usage)
const vulnTemplatesApiKey = new ApiKey(api, 'VulnTemplatesApiKey', {
  description: 'API key for Vulnerability Template management endpoints',
  apiKeyName: 'vuln-templates-key'
});
const vulnTemplatesUsagePlan = new UsagePlan(api, 'VulnTemplatesUsagePlan', {
  name: 'VulnTemplatesUsagePlan',
  throttle: { rateLimit: 50, burstLimit: 20 },
  quota: { limit: 50000, period: Period.MONTH }
});
vulnTemplatesUsagePlan.addApiStage({ stage: sigintRest.deploymentStage });
vulnTemplatesUsagePlan.addApiKey(vulnTemplatesApiKey);

// Usage plan for user-generated API keys (each key attached post-creation).
// We don't pre-create keys here; the Lambda manages key lifecycle.
const userApiKeysUsagePlan = new UsagePlan(api, 'UserApiKeysUsagePlan', {
  name: 'UserApiKeysUsagePlan',
  throttle: { rateLimit: 25, burstLimit: 10 },
  quota: { limit: 20000, period: Period.MONTH }
});
userApiKeysUsagePlan.addApiStage({ stage: sigintRest.deploymentStage });

// Authorizer
const apiAuth = new CognitoUserPoolsAuthorizer(api, 'apiAuth', {
  cognitoUserPools: [authResources.userPool]
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

// Client log ingestion (POST). Accept logs from authenticated users; could be relaxed to NONE if public logging desired.
const clientLogPath = sigintRest.root.addResource('client-log');
clientLogPath.addMethod('POST', new LambdaIntegration(backend.clientLogIngest.resources.lambda), apiConfig);

// MFA Backup Codes routes (auth required)
const mfaPath = sigintRest.root.addResource('mfa');
const backupCodesPath = mfaPath.addResource('backupCodes');
const redeemPath = backupCodesPath.addResource('redeem');
redeemPath.addMethod('POST', new LambdaIntegration(backend.backupCodes.resources.lambda), apiConfig);
const regeneratePath = backupCodesPath.addResource('regenerate');
regeneratePath.addMethod('POST', new LambdaIntegration(backend.backupCodes.resources.lambda), apiConfig);

// Vulnerability Templates (API key auth only). Routes: GET/POST /vuln-templates, GET/PUT/DELETE /vuln-templates/{id}
const vulnTemplatesPath = sigintRest.root.addResource('vuln-templates');
vulnTemplatesPath.addMethod('GET', new LambdaIntegration(backend.vulnTemplates.resources.lambda), { apiKeyRequired: true, authorizationType: AuthorizationType.NONE });
vulnTemplatesPath.addMethod('POST', new LambdaIntegration(backend.vulnTemplates.resources.lambda), { apiKeyRequired: true, authorizationType: AuthorizationType.NONE });
const vulnTemplateItem = vulnTemplatesPath.addResource('{id}');
vulnTemplateItem.addMethod('GET', new LambdaIntegration(backend.vulnTemplates.resources.lambda), { apiKeyRequired: true, authorizationType: AuthorizationType.NONE });
vulnTemplateItem.addMethod('PUT', new LambdaIntegration(backend.vulnTemplates.resources.lambda), { apiKeyRequired: true, authorizationType: AuthorizationType.NONE });
vulnTemplateItem.addMethod('DELETE', new LambdaIntegration(backend.vulnTemplates.resources.lambda), { apiKeyRequired: true, authorizationType: AuthorizationType.NONE });

// User API Keys management (Cognito-authenticated user manages their own keys).
// Routes: GET/POST /user-api-keys, DELETE /user-api-keys/{id}
const userApiKeysPath = sigintRest.root.addResource('user-api-keys');
userApiKeysPath.addMethod('GET', new LambdaIntegration(backend.userApiKeys.resources.lambda), apiConfig);
userApiKeysPath.addMethod('POST', new LambdaIntegration(backend.userApiKeys.resources.lambda), apiConfig);
const userApiKeyItem = userApiKeysPath.addResource('{id}');
userApiKeyItem.addMethod('DELETE', new LambdaIntegration(backend.userApiKeys.resources.lambda), apiConfig);

// Centralized log group env var injection (optional)
const centralLogGroupName = process.env.CENTRAL_LOG_GROUP || 'com/techjavelin/javelin';
// Attach to all custom lambdas we defined (extend list as needed)
[
  backend.runMigrations.resources.lambda,
  backend.listMigrations.resources.lambda,
  backend.clientLogIngest.resources.lambda,
  backend.inviteAdminUser.resources.lambda,
  backend.activateOrganizationAdmin.resources.lambda,
  backend.createUser.resources.lambda,
  backend.updateUser.resources.lambda,
  backend.deleteUser.resources.lambda,
  backend.resetUserPassword.resources.lambda,
  backend.listUsers.resources.lambda,
  backend.updateUserProfileSecure.resources.lambda,
  backend.deleteUserProfileSecure.resources.lambda,
  backend.health.resources.lambda,
  backend.userApiKeys.resources.lambda,
  backend.vulnTemplates.resources.lambda
].forEach(fn => {
  // Some generated resource.lambda types are surfaced as IFunction which doesn't expose addEnvironment in typing.
  // Cast to any to attach env var (runtime supports it on actual Function object).
  (fn as any).addEnvironment('CENTRAL_LOG_GROUP', centralLogGroupName);
});

// Grant Dynamo table access (read/write) to the migrations lambda
migrationStateTable.grantReadWriteData(backend.runMigrations.resources.lambda);
migrationStateTable.grantReadData(backend.listMigrations.resources.lambda);
// Explicitly grant Scan (and related read) permissions to list-migrations lambda.
// Although grantReadData should include Scan, an authorization error was observed in runtime
// (dynamodb:Scan not allowed). We defensively add an explicit policy to ensure the permission.
backend.listMigrations.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: [
    'dynamodb:Scan',
    'dynamodb:GetItem',
    'dynamodb:DescribeTable'
  ],
  resources: [migrationStateTable.tableArn]
}));
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

authResources.authenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);
authResources.unauthenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);

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
      // Latest migration id omitted from synth-time output now that migrations
      // are executed explicitly in CI (script derives latest from code directly).
      stateTableName: migrationStateTable.tableName
    }
  }
});

// Provide env vars to userApiKeys lambda for REST API Id and usage plan id.
// Avoid passing REST API / Usage Plan identifiers directly to prevent cross-stack circular dependencies.
// The userApiKeys function will discover the usage plan ID at runtime by name if not provided.

// IAM permissions for managing API keys (scoped to current account). We restrict to actions needed.
// Narrow IAM: grant only specific API Gateway control plane resources (usage plans & api keys)
backend.userApiKeys.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: [ 'apigateway:GET' ],
  resources: ['arn:aws:apigateway:*::/usageplans', 'arn:aws:apigateway:*::/usageplans/*', 'arn:aws:apigateway:*::/apikeys', 'arn:aws:apigateway:*::/apikeys/*', 'arn:aws:apigateway:*::/usageplans/*/keys', 'arn:aws:apigateway:*::/usageplans/*/keys/*' ]
}));
backend.userApiKeys.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: [ 'apigateway:POST' ],
  resources: ['arn:aws:apigateway:*::/apikeys', 'arn:aws:apigateway:*::/usageplans/*/keys']
}));
backend.userApiKeys.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: [ 'apigateway:DELETE' ],
  resources: ['arn:aws:apigateway:*::/apikeys/*']
}));

