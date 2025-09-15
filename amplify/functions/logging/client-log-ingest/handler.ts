import type { APIGatewayProxyHandler } from 'aws-lambda';

// Simple client log ingestion. Accepts JSON body: { logs: Array<{ level?: string; message: string; context?: any; t?: string }> }
// Writes each entry to console.* which is forwarded to CloudWatch. Intentionally minimal; extend with filtering as needed.
export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };
  if(event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '{}' };

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const logs = Array.isArray(body.logs) ? body.logs : [];
    const reqId = event.requestContext.requestId;
    for(const entry of logs.slice(0, 200)) { // cap batch size
      const level = (entry.level || 'info').toLowerCase();
      const line = {
        kind: 'client-log',
        level,
        message: entry.message,
        context: entry.context,
        t: entry.t || new Date().toISOString(),
        requestId: reqId,
        ip: event.requestContext.identity?.sourceIp
      };
      if(level === 'error' || level === 'warn') console.error(line);
      else console.log(line);
    }
    return { statusCode: 200, headers, body: JSON.stringify({ accepted: Math.min(logs.length, 200) }) };
  } catch (e:any) {
    console.error('[client-log-ingest] parse error', e?.message || e);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'BadRequest', message: 'Invalid log payload' }) };
  }
};
