export function drawPaddle(ctx, x, y, w, h) {
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, w, h);
}

export function clearScreen(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function lineDivide(ctx, canvas, portrait) {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (portrait) {
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
  } else {
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
  }
  ctx.stroke();
}

export function gameScore(ctx, canvas, playerScore, opponentScore, portrait) {
  ctx.fillStyle = "white";
  
  if (portrait) {
    ctx.font = "40px Arial";
    ctx.fillText(`${playerScore}`, canvas.width * 0.07, canvas.height * 0.45);
    ctx.fillText(`${opponentScore}`, canvas.width * 0.07, canvas.height * 0.60);
  } else {
    ctx.font = "50px Arial";
    ctx.fillText(`${playerScore}`, canvas.width * 0.42, canvas.height * 0.08);
    ctx.fillText(`${opponentScore}`, canvas.width * 0.54, canvas.height * 0.08);
  }
}