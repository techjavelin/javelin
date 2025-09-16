import type { APIGatewayProxyHandler } from 'aws-lambda';
import { withLogging } from '../../util/logging.js';

// Enhanced client log ingestion using unified logging wrapper (correlation IDs + central log group forwarding).
// Accepts: { logs: Array<{ level?: string; message: string; context?: any; t?: string }> }
export const handler: APIGatewayProxyHandler = withLogging('client-log-ingest', async (event, logger, correlationId) => {
  const headers: Record<string,string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-correlation-id',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };
  if(event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '{}' } as any;

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const logs = Array.isArray(body.logs) ? body.logs : [];
    const accepted = Math.min(logs.length, 500); // allow a bit higher but still bounded
    const reqId = event.requestContext.requestId;
    for(const entry of logs.slice(0, accepted)) {
      const level = (entry.level || 'info').toLowerCase();
      const payload = {
        kind: 'client-log',
        source: 'frontend',
        level,
        message: entry.message,
        context: entry.context,
        t: entry.t || new Date().toISOString(),
        requestId: reqId,
        ip: event.requestContext.identity?.sourceIp,
        correlationId
      };
      // Route through wrapper logger to ensure central forwarding; map levels
      if(level === 'error') logger.error('client', payload);
      else if(level === 'warn') logger.warn('client', payload);
      else if(level === 'debug') logger.debug('client', payload);
      else logger.info('client', payload);
    }
    return { statusCode: 200, headers, body: JSON.stringify({ accepted }) } as any;
  } catch (e:any) {
    logger.error('parse_error', { error: e?.message || String(e) });
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'BadRequest', message: 'Invalid log payload' }) } as any;
  }
});
