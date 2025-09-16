import type { CognitoUserPoolEvent, Context } from 'aws-lambda';

// Custom Message trigger handler
// Adds a verification link (and preserves the code) for sign-up and resend scenarios.
// FRONTEND_BASE_URL can be configured in the environment. Fallback uses example placeholder.
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'https://app.example.com';

export const handler = async (event: CognitoUserPoolEvent, _context: Context): Promise<CognitoUserPoolEvent> => {
  try {
    const trigger = event.triggerSource;
    const userName = event.userName || ''; // ensure defined for encodeURIComponent
    const code = event.request.codeParameter; // e.g. '{####}' placeholder replaced by Cognito

    // Only customize for sign-up & resend flows. (You could add ForgotPassword etc. if desired.)
    const isVerify = trigger === 'CustomMessage_SignUp' || trigger === 'CustomMessage_ResendCode';

    if (isVerify) {
      const encodedUser = encodeURIComponent(userName);
      const link = `${FRONTEND_BASE_URL.replace(/\/$/, '')}/verify?username=${encodedUser}&code=${code}`;

      // Plain text body (Cognito supports either plain text or HTML if you craft it; keep simple for now)
      const bodyLines: string[] = [
        'Welcome to Javelin!',
        '',
        'Your verification code is: ' + code,
        '',
        'You can also verify your account by clicking the link below:',
        link,
        '',
        'If you did not request this, you can ignore this email.'
      ];

      event.response.emailSubject = 'Verify your Javelin account';
      event.response.emailMessage = bodyLines.join('\n');
    }
  } catch (err) {
    // Fail open: if anything goes wrong, let Cognito fall back to its default message.
    console.error('[custom-message] Error building custom message', err);
  }

  return event;
};
