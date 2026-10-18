import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
if (!(process.platform === 'linux' && process.env.VERCEL === '1')) {
  const cli = path.join(root, 'node_modules', 'playwright', 'cli.js');
  const child = spawn(process.execPath, [cli, 'install', 'chromium', '--no-shell'], {
    stdio: 'inherit',
    env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: path.join(root, '.cache', 'browsers') },
  });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
