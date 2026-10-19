import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root, '.cache', 'browsers');

export function shouldUseServerlessChromium({
  platform = process.platform,
  vercel = process.env.VERCEL,
} = {}) {
  return platform === 'linux' && vercel === '1';
}

export async function launchBrowser({ serverless = shouldUseServerlessChromium() } = {}) {
  const { chromium } = await import('playwright');
  if (serverless) {
    try {
      const { default: linuxChromium } = await import('@sparticuz/chromium');
      linuxChromium.setGraphicsMode = false;
      return await chromium.launch({
        executablePath: await linuxChromium.executablePath(),
        args: [
          // Vercel builds support renderer subprocesses. Single-process mode
          // crashes with multiple contexts and some pages' network activity.
          ...linuxChromium.args.filter(argument => argument !== '--single-process'),
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-gl-drawing-for-tests',
        ],
        headless: true,
      });
    } catch (error) {
      throw new Error(
        `Vercel Chromium could not start on ${process.platform} with Node ${process.version}: ${error.message}`,
        { cause: error },
      );
    }
  }
  return chromium.launch({
    channel: 'chromium', headless: true,
    // Windows VMs can stall Chromium's compositor when a usable GPU is unavailable.
    args: process.platform === 'win32' ? ['--disable-gpu'] : [],
  });
}
