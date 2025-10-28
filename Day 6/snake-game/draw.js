export function titleDraw(ctx, board) {
  ctx.font = "30px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText("Snake Game", board.x + board.size / 2, board.y -30);
}

export function snakeDraw(ctx, snake, board) {
  ctx.fillStyle = "lightgreen";
  for (let part of snake.body) {
    ctx.fillRect(board.x + part.x, board.y + part.y, 20, 20);
  }
}

export function foodDraw(ctx, board, food) {
  ctx.fillStyle = "red";
  ctx.fillRect(board.x + food.x, board.y + food.y, food.size, food.size);
}
