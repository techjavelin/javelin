// Use Smithy packages (v3 SDK internals) for SigV4 signing to avoid direct dependency on deprecated @aws-sdk/* wrappers.
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
// Use aws-sdk credential providers package; fallback to fromNodeProviderChain if defaultProvider unavailable in types
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { defaultProvider, fromNodeProviderChain } from '@aws-sdk/credential-providers';

const endpoint = process.env.GRAPHQL_ENDPOINT || process.env.AMPLIFY_GRAPHQL_ENDPOINT || process.env.API_GRAPHQL_ENDPOINT;
const region = process.env.AWS_REGION || 'us-east-1';

if (!endpoint) {
  console.warn('[graphqlClient] Missing GRAPHQL endpoint env variable');
}

export async function graphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<{ data?: T; errors?: any[] }> {
  if (!endpoint) {
    return { errors: [{ message: 'GraphQL endpoint not configured' }] };
  }
  const body = JSON.stringify({ query, variables });
  const signer = new SignatureV4({
    service: 'appsync',
    region,
  credentials: (typeof defaultProvider === 'function' ? defaultProvider() : fromNodeProviderChain()),
    sha256: Sha256
  });
  const req = new HttpRequest({
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      host: new URL(endpoint).host,
    },
    body,
    protocol: 'https:',
    hostname: new URL(endpoint).hostname,
    path: new URL(endpoint).pathname,
  });
  const signed = await signer.sign(req);
  const fetchRes = await fetch(endpoint, {
    method: 'POST',
    headers: signed.headers as any,
    body,
  });
  const json = await fetchRes.json();
  return json;
}
