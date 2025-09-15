import type { APIGatewayProxyHandler } from 'aws-lambda';
import { withLogging } from '../../util/logging';
// @ts-ignore
import { DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import outputs from '../../../../amplify_outputs.json';

const ddb = new DynamoDBClient({});
const TABLE = (outputs as any)?.custom?.MIGRATIONS?.stateTableName;

export const handler: APIGatewayProxyHandler = withLogging('list-migrations', async (event, log) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json'
  };
  if(event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '{}' };

  const claims = (event.requestContext.authorizer as any)?.claims || {};
  const groupsClaim = claims['cognito:groups'] || claims['cognito:groups'.toLowerCase()];
  const groups: string[] = typeof groupsClaim === 'string' ? groupsClaim.split(',') : Array.isArray(groupsClaim) ? groupsClaim : [];
  if(!groups.includes('admin')) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden', message: 'Admin group required' }) };
  }

  if(!TABLE) return { statusCode: 500, headers, body: JSON.stringify({ error: 'ServerError', message: 'Missing table' }) };

  try {
  log.debug('scanning table', { table: TABLE });
  const scan = await ddb.send(new ScanCommand({ TableName: TABLE }));
    const items = (scan.Items || []).map(i => ({
      pk: i.pk?.S,
      appliedAt: i.appliedAt?.S,
      name: i.name?.S,
      checksum: i.checksum?.S,
      acquiredAt: i.acquiredAt?.S,
      expiresAt: i.expiresAt?.N,
      takeoverAt: i.takeoverAt?.S
    }));
    const migrations = items.filter(r => r.pk?.startsWith('migration#')).map(r => ({
      id: parseInt(r.pk!.split('#')[1]||'0',10),
      name: r.name,
      appliedAt: r.appliedAt,
      checksum: r.checksum
    })).sort((a,b)=>a.id-b.id);
    const lock = items.find(r => r.pk==='lock');
    log.info('list complete', { count: migrations.length, hasLock: !!lock });
    return { statusCode: 200, headers, body: JSON.stringify({ migrations, lock }) };
  } catch(e:any) {
    log.error('scan failed', { error: e?.message || String(e) });
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ScanFailed', message: e?.message || String(e) }) };
  }
});
