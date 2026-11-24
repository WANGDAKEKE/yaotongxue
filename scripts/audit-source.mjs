import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {projectRoot} from './paths.mjs';

const files = execFileSync('git', ['ls-files', '-z'], {cwd: projectRoot, encoding: 'utf8'}).split('\0').filter(Boolean);
const rules = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['credential-token', /(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{24,}|xox[baprs]-[A-Za-z0-9-]{20,}|AKIA[A-Z0-9]{16})/],
  ['credential-assignment', /(?:password|api[_-]?key|access[_-]?token|secret[_-]?key)\s*["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i],
  ['machine-specific-user-path', /\/Users\/xueqiyao(?:\/|$)/],
  ['real-business-endpoint', /115\.190\.148\.168/],
];
const findings = [];
let totalBytes = 0, textFiles = 0;
for (const filename of files) {
  if (/(?:^|\/)(?:state|build|app|verification|node_modules|\.vite|\.aws|\.ssh|\.codex)(?:\/|$)|\.(?:asar|dmg|sqlite3?|db|pem|key|p12|pfx|zip)$/i.test(filename)) {
    findings.push({path: filename, category: 'excluded-file-type'});
  }
  const bytes = execFileSync('git', ['show', `:${filename}`], {cwd: projectRoot, maxBuffer: 16 * 1024 * 1024});
  totalBytes += bytes.length;
  if (bytes.length > 10 * 1024 * 1024) findings.push({path: filename, category: 'file-over-10-MiB'});
  if (!/\.(?:md|json|mjs|js|jsx|css|html|svg|txt|c|py|swift|plist)$/.test(filename) && path.basename(filename) !== '.gitignore') continue;
  textFiles++;
  const text = bytes.toString('utf8');
  // This registry contains public hashed bundle filenames, one of which has a
  // token-like substring. Accept only a JSON array of strict .js basenames.
  const bundleRegistry = filename === 'src/visible-copy-files.json'
    ? JSON.parse(text) : null;
  const publicBundleNamesOnly = Array.isArray(bundleRegistry)
    && bundleRegistry.every(value => typeof value === 'string' && /^[a-zA-Z0-9._-]+\.js$/.test(value));
  for (const [category, pattern] of rules) {
    if (category === 'credential-token' && publicBundleNamesOnly) continue;
    if (pattern.test(text)) findings.push({path: filename, category});
  }
}
console.log(JSON.stringify({files: files.length, textFiles, totalBytes, findings}, null, 2));
if (findings.length) process.exitCode = 1;
