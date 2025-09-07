import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import outputs from '../../amplify_outputs.json'

const cognitoClient = new CognitoIdentityProviderClient({ region: outputs.auth.aws_region })

export async function inviteUserByEmail(email: string): Promise<string> {
  // 1. Create the user in Cognito (send invite email)
  const createUserRes = await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: outputs.auth.user_pool_id,
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' }
    ],
    DesiredDeliveryMediums: ['EMAIL'],
    MessageAction: 'SUPPRESS' // Remove to send default invite email
  }))
  // 2. Get the user's sub (Cognito userId)
  const getUserRes = await cognitoClient.send(new AdminGetUserCommand({
    UserPoolId: outputs.auth.user_pool_id,
    Username: email
  }))
  const subAttr = getUserRes.UserAttributes?.find(attr => attr.Name === 'sub')
  if (!subAttr?.Value) throw new Error('Could not get Cognito sub for invited user')
  return subAttr.Value
}
