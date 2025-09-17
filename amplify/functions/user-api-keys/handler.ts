import type { APIGatewayProxyHandler } from 'aws-lambda';
import { withLogging } from '../util/logging';
import { APIGatewayClient, CreateApiKeyCommand, GetApiKeysCommand, DeleteApiKeyCommand, UpdateApiKeyCommand, CreateUsagePlanKeyCommand, type ApiKey } from '@aws-sdk/client-api-gateway';

const client = new APIGatewayClient({});
const REST_API_ID = process.env.REST_API_ID; // derive from deployed Rest API (could be output injected)
const USAGE_PLAN_ID = process.env.USER_API_KEY_USAGE_PLAN_ID; // dedicated usage plan id

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
  if(!REST_API_ID || !USAGE_PLAN_ID) return serverError(new Error('Missing REST_API_ID or USAGE_PLAN_ID env'));

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
        // Attach to usage plan
        await client.send(new CreateUsagePlanKeyCommand({ keyId: createRes.id, keyType: 'API_KEY', usagePlanId: USAGE_PLAN_ID }));
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
