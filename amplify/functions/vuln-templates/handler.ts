import type { APIGatewayProxyHandler } from 'aws-lambda';
import { withLogging } from '../util/logging';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { getAmplifyOutputs } from '../../outputs';

// Configure Amplify once per cold start (idempotent)
try { if(!(Amplify as any)._config) Amplify.configure(getAmplifyOutputs() as any); } catch {}

const API_KEY = process.env.VULN_TEMPLATES_API_KEY || process.env.REST_API_KEY || process.env.API_KEY;

function unauthorized(){
  return { statusCode: 401, headers: baseHeaders(), body: JSON.stringify({ error: 'Unauthorized' }) };
}

function baseHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-api-key', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' }; }

const client = generateClient<Schema>();

// Basic router style handler using path + method. Assumes resource mounted at /vuln-templates
export const handler: APIGatewayProxyHandler = withLogging('vuln-templates', async (event, log) => {
  if(event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: baseHeaders(), body: '' };

  // API key auth (x-api-key header)
  const key = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  if(!API_KEY || key !== API_KEY) return unauthorized();

  const headers = baseHeaders();
  const id = event.pathParameters?.id;

  try {
    if(event.httpMethod === 'GET' && !id) {
      // list
      const res = await client.models.VulnerabilityTemplate.list({});
      return { statusCode: 200, headers, body: JSON.stringify(res.data) };
    }
    if(event.httpMethod === 'GET' && id) {
      const res = await client.models.VulnerabilityTemplate.get({ id });
      if(!res.data) return { statusCode: 404, headers, body: JSON.stringify({ error: 'NotFound' }) };
      return { statusCode: 200, headers, body: JSON.stringify(res.data) };
    }
    if(event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      // Minimal required fields; pass through others
      const createRes = await client.models.VulnerabilityTemplate.create(body);
      if(createRes.errors?.length) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Validation', details: createRes.errors }) };
      return { statusCode: 201, headers, body: JSON.stringify(createRes.data) };
    }
    if(event.httpMethod === 'PUT' && id) {
      const body = event.body ? JSON.parse(event.body) : {};
      const updateRes = await client.models.VulnerabilityTemplate.update({ id, ...body });
      if(updateRes.errors?.length) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Validation', details: updateRes.errors }) };
      return { statusCode: 200, headers, body: JSON.stringify(updateRes.data) };
    }
    if(event.httpMethod === 'DELETE' && id) {
      const del = await client.models.VulnerabilityTemplate.delete({ id });
      return { statusCode: 200, headers, body: JSON.stringify({ deleted: !!del.data }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'MethodNotAllowed' }) };
  } catch (e:any) {
    log.error('handler error', { error: e?.message });
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ServerError', message: e?.message || 'unexpected' }) };
  }
});
