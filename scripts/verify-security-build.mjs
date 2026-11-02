import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

async function htmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (path.endsWith('.html')) files.push(path);
  }
  return files;
}

let checked = 0;
for (const path of await htmlFiles('dist')) {
  const html = await readFile(path, 'utf8');
  if (path.startsWith('dist/admin/')) {
    assert.ok(!html.includes('unpkg.com'), 'Admin must use the self-hosted bundle');
    assert.ok(!/<script>/.test(html), 'Admin initialization scripts must be external');
  } else {
    const csp = html.match(/<meta http-equiv="content-security-policy" content="([^"]+)"/i)?.[1];
    assert.ok(csp, `${path}: missing CSP`);
    const scripts = csp.match(/(?:^|;)\s*script-src\s+([^;]+)/)?.[1];
    assert.ok(scripts && !scripts.includes("'unsafe-inline'"), `${path}: unsafe script policy`);
    for (const [_, attrs, contents] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc=/.test(attrs)) continue;
      if (/type="application\/ld\+json"/.test(attrs)) {
        JSON.parse(contents);
        assert.ok(!contents.includes('<'), `${path}: unsafe JSON-LD markup`);
        continue;
      }
      const hash = createHash('sha256').update(contents).digest('base64');
      assert.ok(scripts.includes(`'sha256-${hash}'`), `${path}: inline script hash missing`);
    }
    checked++;
  }
  for (const [_, src] of html.matchAll(/<script\b[^>]*\bsrc="(\/[^"]+)"/gi)) {
    await access(join('dist', src.split('?')[0]));
  }
}
console.log(`Verified CSP hashes on ${checked} public pages and local editor script paths.`);
