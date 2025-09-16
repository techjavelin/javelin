import type { APIGatewayProxyHandler } from 'aws-lambda';
import { withLogging } from '../../util/logging';
// @ts-ignore - dependencies resolved in function bundling context
import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
// @ts-ignore - dependencies resolved in function bundling context
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { runMigrations } from '../../../data/migrations/runner';
import type { MigrationStorageAdapter } from '../../../data/migrations/runner';
import { getAmplifyOutputs } from '../../../outputs';

const ddb = new DynamoDBClient({});
const TABLE = (getAmplifyOutputs() as any)?.custom?.MIGRATIONS?.stateTableName;

if(!TABLE) {
  // eslint-disable-next-line no-console
  console.error('Migration state table name not found in outputs');
}

// Basic ISO date helper
function isoNow(){ return new Date().toISOString(); }

// Storage adapter backed by DynamoDB table (per-migration items; list via Scan on small table)
const storageAdapter: MigrationStorageAdapter = {
  listAppliedIds: async () => {
    const scan = await ddb.send(new ScanCommand({ TableName: TABLE, ProjectionExpression: 'pk' }));
    const ids: number[] = [];
    for(const item of scan.Items || []) {
      const pk = item.pk?.S;
      if(pk && pk.startsWith('migration#')) {
        const num = parseInt(pk.split('#')[1] || '', 10);
        if(!isNaN(num)) ids.push(num);
      }
    }
    return { ids };
  },
  recordApplied: async ({ id, name, checksum }) => {
    const appliedAt = isoNow();
    await ddb.send(new PutItemCommand({ TableName: TABLE, Item: { pk: { S: `migration#${id}` }, name: { S: name }, appliedAt: { S: appliedAt }, checksum: { S: checksum }}}));
  }
};

// Lock configuration
const LOCK_TTL_SECONDS = 5 * 60; // 5 minutes

// Attempt to acquire lock; if stale (> TTL) we take over by overwriting.
// If forceTakeover is true we will unconditionally replace existing lock (admin explicit action).
async function acquireLock(forceTakeover = false): Promise<boolean> {
  const nowIso = isoNow();
  const nowSec = Math.floor(Date.now()/1000);
  // First try conditional create
  try {
    await ddb.send(new PutItemCommand({
      TableName: TABLE,
      Item: { pk: { S: 'lock' }, acquiredAt: { S: nowIso }, expiresAt: { N: String(nowSec + LOCK_TTL_SECONDS) } },
      ConditionExpression: 'attribute_not_exists(pk)'
    }));
    return true;
  } catch {}
  // Check existing lock
  try {
    const existing = await ddb.send(new GetItemCommand({ TableName: TABLE, Key: { pk: { S: 'lock' }}}));
    if(existing.Item){
      const exp = parseInt(existing.Item.expiresAt?.N || '0', 10);
      if(forceTakeover || (exp && nowSec > exp)) {
        // Stale or forced: replace existing lock (best-effort)
        await ddb.send(new PutItemCommand({ TableName: TABLE, Item: { pk: { S: 'lock' }, acquiredAt: { S: nowIso }, expiresAt: { N: String(nowSec + LOCK_TTL_SECONDS) }, takeoverAt: { S: nowIso }, forced: { BOOL: forceTakeover }}}));
        return true;
      }
    }
  } catch {}
  return false;
}

export const handler: APIGatewayProxyHandler = withLogging('run-migrations', async (event, log) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };
  if(event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: JSON.stringify({}) };

  // Basic authz: ensure caller has admin group (cognito groups in claims)
  const claims = (event.requestContext.authorizer as any)?.claims || {};
  const groupsClaim = claims['cognito:groups'] || claims['cognito:groups'.toLowerCase()];
  const groups: string[] = typeof groupsClaim === 'string' ? groupsClaim.split(',') : Array.isArray(groupsClaim) ? groupsClaim : [];
  if(!groups.includes('admin')) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden', message: 'Admin group required' }) };
  }

  if(!TABLE){
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ServerError', message: 'Migration state table missing' }) };
  }

  let takeover = false;
  let rerunIds: number[] = [];
  try {
    if(event.body){
      const parsed = JSON.parse(event.body);
      takeover = !!parsed.takeover;
      if(Array.isArray(parsed.rerunIds)) {
        rerunIds = parsed.rerunIds.filter((n: any)=> Number.isInteger(n) && n > 0);
      }
    }
  } catch {}

  log.info('parsed request', { takeover, rerunIds });
  const locked = await acquireLock(takeover);
  if(!locked){
    log.warn('lock not acquired', { takeoverRequested: takeover });
    return { statusCode: 423, headers, body: JSON.stringify({ error: 'Locked', message: 'Another migration run in progress', takeoverRequested: takeover }) };
  }

  try {
  // If specific migrations requested for re-run, delete their state records first (idempotent best effort)
  if(rerunIds.length){
    log.info('rerun purge start', { count: rerunIds.length });
    for(const id of rerunIds){
      try { await ddb.send(new DeleteItemCommand({ TableName: TABLE, Key: { pk: { S: `migration#${id}` }}})); log.debug('deleted prior state',{ id }); } catch {}
    }
  }
  log.info('running migrations');
  const summary = await runMigrations({ storageAdapter, skipOnConfigError: false });
  log.info('run complete', summary);
  return { statusCode: 200, headers, body: JSON.stringify({ summary, takeover, rerunIds }) };
  } catch(e:any){
    log.error('migration run failed', { error: e?.message || String(e) });
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'MigrationFailed', message: e?.message || String(e) }) };
  } finally {
    // Release lock (best-effort). In case of concurrent delete ignore errors.
    try { await ddb.send(new DeleteItemCommand({ TableName: TABLE, Key: { pk: { S: 'lock' }}})); log.debug('lock released'); } catch {}
  }
});
