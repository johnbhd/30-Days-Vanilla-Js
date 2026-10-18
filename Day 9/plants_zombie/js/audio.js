// Background music: ONE shared Audio instance, autoplay-safe start on the
// first user gesture, mute with localStorage persistence. All music state
// lives here — combat state (state.js) never sees it. Import-safe in Node:
// without an Audio global every playback call is a silent no-op while the
// mute flag still behaves, so headless tests can drive the logic.
//
// Browser autoplay policy: audio may only start after a user gesture, and
// play() can still reject — every play() goes through playSafe(), which
// swallows the rejection without console spam.

let el = null;       // the singleton — constructed exactly once, ever
let started = false; // a gesture has (attempted to) start playback

const SRC = 'audio/bgm/tower-defense-theme.ogg';
const VOLUME = 0.32; // moderate background level (spec: 0.25-0.40)
const STORAGE_KEY = 'pvzMusicMuted';

let muted = readMuted();

function readMuted() {
  try { return globalThis.localStorage?.getItem(STORAGE_KEY) === '1'; }
  catch { return false; } // private mode / blocked storage: session-only flag
}
function persistMuted() {
  try { globalThis.localStorage?.setItem(STORAGE_KEY, muted ? '1' : '0'); }
  catch { /* session-only fallback */ }
}
function ensureAudio() {
  if (el || typeof globalThis.Audio === 'undefined') return el;
  el = new globalThis.Audio(SRC);
  el.loop = true;
  el.volume = VOLUME;
  el.muted = muted;
  return el;
}
function playSafe() {
  const p = el.play();
  if (p && typeof p.catch === 'function') p.catch(() => {}); // autoplay rejection: silent
}

// Called from the first user gesture (pointerdown/keydown). Idempotent.
export function startOnGesture() {
  const a = ensureAudio();
  if (!a || started) return;
  started = true;
  if (muted) return; // persisted mute: stay silent until the player unmutes
  playSafe();
}
export function toggleMute() {
  muted = !muted;
  persistMuted();
  const a = ensureAudio();
  if (a) a.muted = muted; // muted, not paused: position preserved for seamless unmute
  return muted;
}
export function isMuted() { return muted; }
export function pause() {
  const a = ensureAudio();
  if (a && !a.paused) a.pause(); // idempotent: called every frame during Game Over
}
export function resume() {
  const a = ensureAudio();
  if (!a || !started || muted) return;
  playSafe();
}
// Test seam: drop the singleton and re-read the persisted flag.
export function _resetForTests() {
  el = null;
  started = false;
  muted = readMuted();
}
