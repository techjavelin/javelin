#!/usr/bin/env tsx
/*
  Scans src/ for direct client.models.<Model>.list(...) calls missing an auth wrapper.
  Allowed patterns:
    client.models.Model.list(withAuth(
    client.models.Model.list(withUserAuth(
    client.models.Model.list(withPublic(

  Fails (exit 1) if any bare calls are found.
*/
// NOTE: There was a persistent TS phantom error referencing globby's default export even after
// removing globby usage. We replaced implementation with fast-glob. If an editor cache still
// surfaces a globby-related diagnostic, clear TS server cache. This file intentionally avoids
// importing globby.
// Use fast-glob directly to avoid ESM interop issues seen with globby in ts-node/tsx context
import fg from 'fast-glob';
import { readFileSync } from 'fs';

async function main(){
  // Support both ESM named export style (globby function) and potential CJS default interop
  const files = await fg(['src/**/*.{ts,vue}'], { dot: false });
  const violations: { file: string; line: number; snippet: string }[] = [];
  const allowed = /(withAuth\(|withUserAuth\(|withPublic\()/;
  const listCall = /client\.models\.[A-Za-z0-9_]+\.list\s*\(/;

  for(const file of files){
    let content = readFileSync(file,'utf8');
    // crude strip of multiline comments to reduce false positives
    content = content.replace(/\/\*[\s\S]*?\*\//g,'');
    const lines = content.split(/\n/);
    lines.forEach((line, idx) => {
      if(listCall.test(line)){
        // look ahead small window until matching paren end or next semicolon
        const window = lines.slice(idx, idx+5).join(' ');
        if(!allowed.test(window)){
          violations.push({ file, line: idx+1, snippet: line.trim() });
        }
      }
    });
  }

  if(violations.length){
    console.error('\nAuth Wrapper Lint: Found unwrapped list() calls:');
    for(const v of violations){
      console.error(`  ${v.file}:${v.line} -> ${v.snippet}`);
    }
    console.error('\nEach client.models.<Model>.list call must use withAuth/withUserAuth/withPublic.');
    process.exit(1);
  } else {
    console.log('Auth Wrapper Lint: No violations found.');
  }
}

main().catch(e=>{ console.error('check-auth-wrappers failed', e); process.exit(1); });
