const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const snake = {
  x: 200,
  y: 200,
  size: 20,
  speed: 20,
  dx: 0,
  dy: 0
}

const board = {
  x: 0,
  y: 0,
  size: 400
}

function titleDraw() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText("Snake Game", board.x + board.size / 2, board.y -30);
}

function snakeDraw() {
  ctx.fillStyle = "lightgreen";
  ctx.fillRect(board.x + snake.x, board.y + snake.y, 20, 20);
}

function foodDraw() {
  ctx.fillStyle = "red";
  ctx.fillRect(board.x + 100, board.y + 100, 20, 20);
}

function gameBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  board.x = (canvas.width / 2) - (board.size / 2);
  board.y = (canvas.height / 2) - (board.size / 2);
  
  ctx.fillStyle = "black";
  ctx.fillRect(board.x, board.y, board.size, board.size);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gameBoard();
  snakeDraw();
  foodDraw();
  titleDraw();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();