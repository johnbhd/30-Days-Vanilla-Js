export function snakeMove(e, snake) {
  if (e.key === "ArrowUp" && snake.dy === 0) {
    snake.dx = 0; snake.dy = -snake.speed;
  } else if (e.key === "ArrowDown" && snake.dy === 0) {
    snake.dx = 0; snake.dy = snake.speed;
  } else if (e.key === "ArrowLeft" && snake.dx === 0) {
    snake.dx = -snake.speed; snake.dy = 0;
  } else if (e.key === "ArrowRight" && snake.dx === 0) {
    snake.dx = snake.speed; snake.dy = 0;
  }
}
export function buttonMove(snake){
  document.getElementById("up").onclick = () => { if (snake.dy === 0) { snake.dx = 0; snake.dy = -snake.speed; } };
  document.getElementById("down").onclick = () => { if (snake.dy === 0) { snake.dx = 0; snake.dy = snake.speed; } };
  document.getElementById("left").onclick = () => { if (snake.dx === 0) { snake.dx = -snake.speed; snake.dy = 0; } };
  document.getElementById("right").onclick = () => { if (snake.dx === 0) { snake.dx = snake.speed; snake.dy = 0; } };
}