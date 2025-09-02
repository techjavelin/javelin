import { defineBackend, Backend, DefineBackendProps } from "@aws-amplify/backend";
import { aws_apigateway, Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";

import * as Organization from './sigint/Organization.api';

export const OrganizationAPI = {
  create: Organization.createOrganization,
  // delete: Organization.deleteOrganization,
  // get: Organization.getOrganization,
  // inviteUser: Organization.inviteUserToOrganization,
  // list: Organization.listOrganizations,
  // update: Organization.updateOrganization
};

