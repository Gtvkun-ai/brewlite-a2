// Explicit local demo configuration. No production services or stored secrets.
const { spawnSync, spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const env = {
  ...process.env,
  DATABASE_URL: 'postgresql://brew_demo:brewlite_demo_local@127.0.0.1:55432/brewlite_demo?schema=public',
  JWT_SECRET: 'brewlite-isolated-local-demo-secret-never-use-in-production-2026',
  DEMO_ACCOUNT_PASSWORD: 'Password123!',
  E2E_ACCOUNT_PASSWORD: 'Password123!',
  CORS_ORIGIN: 'http://localhost:3100',
  NEXT_PUBLIC_API_URL: 'http://localhost:3101',
  NEXT_PUBLIC_USE_FIXTURES: 'false',
  DEMO_ORDER_PROGRESSION: 'true',
};
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', ...options });
  if (result.status !== 0) process.exit(result.status || 1);
}
function launch(services) {
  let stopping = false;
  const children = services.map(({ args, options = {} }) => spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit', ...options }));
  function stop(signal = 'SIGTERM') {
    if (stopping) return;
    stopping = true;
    children.forEach(child => { if (child.exitCode === null) child.kill(signal); });
  }
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop());
  children.forEach(child => {
    child.on('error', error => { console.error(error.message); process.exitCode = 1; stop(); });
    child.on('exit', code => { if (!stopping) { process.exitCode = code || 0; stop(); } });
  });
}
const api = { args: [path.join(root, 'apps/api/dist/main.js')], options: { env: { ...env, PORT: '3101', NODE_ENV: 'development' } } };
const web = { args: [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '-p', '3100'], options: { cwd: path.join(root, 'apps/web') } };
const mode = process.argv[2];
if (mode === 'prepare') {
  run('docker', ['compose', '-p', 'brewlite-acceptance', '-f', 'docker-compose.demo.yml', 'up', '-d', '--wait']);
  run('npx', ['prisma', 'generate', '--schema', 'apps/api/prisma/schema.prisma']);
  run('npx', ['prisma', 'migrate', 'deploy', '--schema', 'apps/api/prisma/schema.prisma']);
  run('npm', ['run', 'prisma:seed', '--workspace', '@brewlite/api'], { env: { ...env, NODE_ENV: 'development' } });
} else if (mode === 'build') {
  run('npm', ['run', 'build']);
} else if (mode === 'api') {
  launch([api]);
} else if (mode === 'web') {
  launch([web]);
} else if (mode === 'start') {
  launch([api, web]);
} else {
  console.error('Usage: node scripts/demo.cjs prepare|build|start|api|web');
  process.exitCode = 1;
}
