import assert from 'node:assert/strict';
import test from 'node:test';
import linuxChromium from '@sparticuz/chromium';

const browser = await import('../scripts/browser.mjs');
const { chromium } = await import('playwright');

test('uses the serverless Chromium package only on Vercel Linux', () => {
  assert.equal(browser.shouldUseServerlessChromium({ platform: 'linux', vercel: '1' }), true);
  assert.equal(browser.shouldUseServerlessChromium({ platform: 'win32', vercel: '1' }), false);
  assert.equal(browser.shouldUseServerlessChromium({ platform: 'linux', vercel: undefined }), false);
});

test('Vercel launches packaged Chromium without the unstable single-process flag', async t => {
  let options;
  t.mock.method(linuxChromium, 'executablePath', async () => '/packaged/chromium');
  t.mock.method(chromium, 'launch', async value => { options = value; });
  await browser.launchBrowser({ serverless: true });
  assert.equal(options.executablePath, '/packaged/chromium');
  assert.equal(options.args.includes('--single-process'), false);
  assert.equal(options.args.includes('--no-sandbox'), true);
});
