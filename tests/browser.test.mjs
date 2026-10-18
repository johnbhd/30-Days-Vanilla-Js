import assert from 'node:assert/strict';
import test from 'node:test';

const browser = await import('../scripts/browser.mjs');

test('uses the serverless Chromium package only on Vercel Linux', () => {
  assert.equal(browser.shouldUseServerlessChromium({ platform: 'linux', vercel: '1' }), true);
  assert.equal(browser.shouldUseServerlessChromium({ platform: 'win32', vercel: '1' }), false);
  assert.equal(browser.shouldUseServerlessChromium({ platform: 'linux', vercel: undefined }), false);
});
