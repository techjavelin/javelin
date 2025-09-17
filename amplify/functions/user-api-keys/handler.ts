import type { APIGatewayProxyHandler } from 'aws-lambda';
import { withLogging } from '../util/logging';
import { APIGatewayClient, CreateApiKeyCommand, GetApiKeysCommand, DeleteApiKeyCommand, UpdateApiKeyCommand, CreateUsagePlanKeyCommand, GetUsagePlansCommand, type ApiKey } from '@aws-sdk/client-api-gateway';

const client = new APIGatewayClient({});
// We avoid hard dependency on API / usage plan IDs to reduce inter-stack coupling.
// Usage plan id is resolved by name on first invocation if not injected via env.
const USAGE_PLAN_NAME = 'UserApiKeysUsagePlan';
let resolvedUsagePlanId: string | null = process.env.USER_API_KEY_USAGE_PLAN_ID || null;

async function ensureUsagePlanId(): Promise<string> {
  if(resolvedUsagePlanId) return resolvedUsagePlanId;
  const plans = await client.send(new GetUsagePlansCommand({ limit: 50 }));
  const match = (plans.items||[]).find(p => p.name === USAGE_PLAN_NAME);
  if(!match || !match.id) throw new Error('Usage plan not found: ' + USAGE_PLAN_NAME);
  resolvedUsagePlanId = match.id;
  return resolvedUsagePlanId;
}

function baseHeaders(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
  };
}

function forbidden(msg = 'Forbidden'){ return { statusCode: 403, headers: baseHeaders(), body: JSON.stringify({ error: 'Forbidden', message: msg })}; }
function serverError(e: any){ return { statusCode: 500, headers: baseHeaders(), body: JSON.stringify({ error: 'ServerError', message: e?.message || 'error' })}; }

// Helper to build a deterministic key name/tag set referencing user
function keyNameForUser(userSub: string){ return `user-${userSub}`; }

export const handler: APIGatewayProxyHandler = withLogging('user-api-keys', async (event, log) => {
  if(event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: baseHeaders(), body: '' };
  // Ensure usage plan id (runtime discovery fallback)
  try { await ensureUsagePlanId(); } catch(e:any){ return serverError(e); }

  const claims = (event.requestContext.authorizer as any)?.claims || {};
  const sub = claims.sub;
  if(!sub) return forbidden('Missing user identity');

  try {
    // List keys for user
    if(event.httpMethod === 'GET') {
      const list = await client.send(new GetApiKeysCommand({ includeValues: false, limit: 500 }));
      const items = (list.items || [] as ApiKey[])
        .filter((k: ApiKey) => k.tags && k.tags['owner-sub'] === sub)
        .map((k: ApiKey) => ({ id: k.id, name: k.name, createdDate: k.createdDate })); // Do NOT expose key value after creation
      return { statusCode: 200, headers: baseHeaders(), body: JSON.stringify(items) };
    }

    if(event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const name = body.name || keyNameForUser(sub) + '-' + Date.now();
      const createRes = await client.send(new CreateApiKeyCommand({
        name,
        enabled: true,
        tags: { 'owner-sub': sub, 'purpose': 'user-generated' }
      }));
      if(createRes.id && createRes.value) {
        const usagePlanId = await ensureUsagePlanId();
        await client.send(new CreateUsagePlanKeyCommand({ keyId: createRes.id, keyType: 'API_KEY', usagePlanId }));
      }
      return { statusCode: 201, headers: baseHeaders(), body: JSON.stringify({ id: createRes.id, value: createRes.value, name: createRes.name, createdDate: createRes.createdDate }) };
    }

    if(event.httpMethod === 'DELETE') {
      const id = event.pathParameters?.id;
      if(!id) return { statusCode: 400, headers: baseHeaders(), body: JSON.stringify({ error: 'BadRequest', message: 'Missing id path param' }) };
      // Validate ownership before delete
      const list = await client.send(new GetApiKeysCommand({ includeValues: false, limit: 500 }));
      const target = (list.items || [] as ApiKey[]).find((k: ApiKey) => k.id === id);
      if(!target) return { statusCode: 404, headers: baseHeaders(), body: JSON.stringify({ error: 'NotFound' }) };
      if(!(target.tags && target.tags['owner-sub'] === sub)) return forbidden('Not owner');
      await client.send(new DeleteApiKeyCommand({ apiKey: id }));
      return { statusCode: 200, headers: baseHeaders(), body: JSON.stringify({ deleted: true }) };
    }

    return { statusCode: 405, headers: baseHeaders(), body: JSON.stringify({ error: 'MethodNotAllowed' }) };
  } catch (e:any) {
    log.error('handler error', { error: e?.message });
    return serverError(e);
  }
});
