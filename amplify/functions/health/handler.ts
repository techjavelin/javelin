import type { APIGatewayProxyHandler } from 'aws-lambda'

// Lightweight health check Lambda: returns static metadata & timestamp.
// Designed to be publicly accessible (no auth) and CORS friendly so the
// frontend can probe API availability + CORS readiness at startup.
export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({}) }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'ok',
      service: 'pulse-sigint-api',
      ts: new Date().toISOString(),
      region: process.env.AWS_REGION || 'unknown'
    })
  }
}
