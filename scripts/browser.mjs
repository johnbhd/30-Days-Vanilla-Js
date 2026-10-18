import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root, '.cache', 'browsers');

export async function launchBrowser() {
  const { chromium } = await import('playwright');
  if (process.env.VERCEL === '1') {
    const { default: linuxChromium } = await import('@sparticuz/chromium');
    return chromium.launch({ executablePath: await linuxChromium.executablePath(), args: linuxChromium.args, headless: true });
  }
  return chromium.launch({
    channel: 'chromium', headless: true,
    // Windows VMs can stall Chromium's compositor when a usable GPU is unavailable.
    args: process.platform === 'win32' ? ['--disable-gpu'] : [],
  });
}
