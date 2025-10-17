export function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return isMobilePortrait(canvas);
}

export function isMobilePortrait(canvas) {
  return canvas.height > canvas.width;
}

export function setupCanvas(canvas, portrait) {
  // Placeholder for future setup logic if needed
}
