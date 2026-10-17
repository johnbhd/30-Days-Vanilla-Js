// Sprite loading (one-time, guarded for headless tests) + sprite readiness.

// --- Sprites (OpenGameArt: zombie by Clint Bellanger CC-BY 3.0,
//     sunflower by Robyn CC0/CC-BY, man-eating plant by bevouliin.com CC-BY 4.0) ---
export const SPRITE_SRC = {
  sunflower: 'images/sunflower.png',
  peashooter: 'images/peashooter_cut.png',
  wallnut: 'images/wallnut.png',    // original art created for this project
  snowpea: 'images/snowpea.png',    // CC-BY 4.0 derivative of peashooter_cut (bevouliin.com)
  repeater: 'images/repeater.png',  // CC-BY 4.0 derivative of peashooter_cut (bevouliin.com)
  zombie: 'images/zombie.png',
};

const sprites = {};

export function loadSprites() {
  if (typeof Image === 'undefined') return; // headless test env: keep procedural fallback
  for (const key of Object.keys(SPRITE_SRC)) {
    const img = new Image();
    img.src = SPRITE_SRC[key];
    sprites[key] = img;
  }
}

export function getSprite(key) {
  return sprites[key];
}

export function spriteReady(key) {
  const s = sprites[key];
  return !!(s && s.complete && s.naturalWidth > 0);
}
