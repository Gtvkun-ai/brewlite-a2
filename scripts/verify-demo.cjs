const { spawnSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'docs/evidence/demo-acceptance-2026-11-14/checks');
mkdirSync(dir, { recursive: true });
const checks = [
  ['lint', 'npm', ['run', 'lint']],
  ['api-tests', 'npm', ['run', 'test', '--workspace', '@brewlite/api', '--', '--runInBand', '--watchman=false']],
  ['web-tests', 'npm', ['run', 'test', '--workspace', '@brewlite/web']],
  ['build', process.execPath, ['scripts/demo.cjs', 'build']],
  ['diff-check', 'git', ['diff', '--check']],
];
const results = [];
for (const [name, command, args] of checks) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const output = (result.stdout || '') + (result.stderr || '');
  writeFileSync(path.join(dir, `${name}.log`), `$ ${command} ${args.join(' ')}\nStarted: ${startedAt}\n${output}\nExit: ${result.status}\n`);
  results.push({ name, command: [command, ...args].join(' '), startedAt, finishedAt: new Date().toISOString(), exitCode: result.status });
  console.log(`${name}: ${result.status === 0 ? 'PASS' : 'FAIL'} (exit ${result.status})`);
  if (result.status !== 0) console.error(output.slice(-6000));
}
writeFileSync(path.join(dir, 'results.json'), JSON.stringify(results, null, 2));
process.exitCode = results.every(result => result.exitCode === 0) ? 0 : 1;
