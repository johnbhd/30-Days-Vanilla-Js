/**
 * Utility functions
 */

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get distance between two points
 */
function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Normalize a vector (dx, dy) to length 1
 */
function normalize(dx, dy) {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

/**
 * Convert canvas screen coords to map tile coords
 */
function screenToTile(screenX, screenY, camera) {
  return {
    x: Math.floor((screenX + camera.x) / GAME.TILE_SIZE),
    y: Math.floor((screenY + camera.y) / GAME.TILE_SIZE)
  };
}

/**
 * Convert map tile coords to canvas screen coords
 */
function tileToScreen(tileX, tileY, camera) {
  return {
    x: tileX * GAME.TILE_SIZE - camera.x,
    y: tileY * GAME.TILE_SIZE - camera.y
  };
}

/**
 * Load an image and return a Promise
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
