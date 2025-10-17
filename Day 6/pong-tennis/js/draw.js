export function drawPaddle(ctx, x, y, w, h) {
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, w, h);
}

export function clearScreen(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
