#!/usr/bin/env tsx
/**
 * check-operation-ids.ts
 * Ensures every path+method has an operationId. If missing, will propose deterministic ids
 * and optionally write them back (when --write flag passed).
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

interface OpenAPI {
  paths?: Record<string, any>;
}

const SPEC_PATH = path.resolve('docs/api/openapi.yaml');
const WRITE = process.argv.includes('--write');

function loadSpec(): OpenAPI {
  const raw = fs.readFileSync(SPEC_PATH, 'utf8');
  return yaml.load(raw) as OpenAPI;
}

function toOperationId(method: string, p: string) {
  // /user-api-keys/{id} -> userApiKeysDelete / userApiKeysGet etc.
  const parts = p.replace(/^\/+/, '').split('/').filter(Boolean).map(seg => {
    if(seg.startsWith('{') && seg.endsWith('}')) return 'By' + seg.slice(1,-1).replace(/[^a-zA-Z0-9]/g,'').replace(/^[a-z]/,c=>c.toUpperCase());
    return seg.replace(/[^a-zA-Z0-9]/g,' ').split(' ').filter(Boolean).map((w,i)=> i===0 ? w.toLowerCase() : (w[0].toUpperCase()+w.slice(1).toLowerCase())).join('');
  });
  const resource = parts.map((p,i)=> i===0 ? p : p[0].toUpperCase()+p.slice(1)).join('');
  return method.toLowerCase() + resource.charAt(0).toUpperCase() + resource.slice(1);
}

function main(){
  const spec = loadSpec();
  if(!spec.paths) { console.error('No paths in spec'); process.exit(1); }
  const missing: { path: string; method: string; suggested: string }[] = [];
  for(const [p, ops] of Object.entries(spec.paths)) {
    for(const method of Object.keys(ops)) {
      const opObj = ops[method];
      if(!opObj || typeof opObj !== 'object') continue;
      const isHttp = ['get','post','put','patch','delete','options','head'].includes(method);
      if(!isHttp) continue;
      if(!opObj.operationId) {
        const suggested = toOperationId(method, p);
        missing.push({ path: p, method, suggested });
        if(WRITE) opObj.operationId = suggested;
      }
    }
  }
  if(missing.length === 0) {
    console.log('All operations have operationId values.');
  } else {
    console.log('Missing operationIds:');
    missing.forEach(m => console.log(`${m.method.toUpperCase()} ${m.path} -> ${m.suggested}`));
  }
  if(WRITE && missing.length){
    const serialized = yaml.dump(spec, { lineWidth: 100 });
    fs.writeFileSync(SPEC_PATH, serialized, 'utf8');
    console.log(`Wrote ${missing.length} operationIds to spec.`);
  }
  if(missing.length && !WRITE) process.exitCode = 1; // Fail CI if missing but not auto-fixed
}

main();
