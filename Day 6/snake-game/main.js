import { snakeMove, buttonMove } from "./controls.js"
import { snakeDraw, foodDraw, titleDraw } from "./draw.js"

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const food = {
  x: 100, 
  y: 100, 
  size: 20
}

const snake = {
  x: 200,
  y: 200,
  size: 20,
  speed: 20,
  dx: 0,
  dy: 0, 
  body: [{ x: 200, y: 200}]
}
const board = {
  x: 0,
  y: 0,
  size: 400
}

function randomFood() {
  const max = board.size / food.size - 1;
  food.x = Math.floor(Math.random() * max) * food.size;
  food.y = Math.floor(Math.random() * max) * food.size;
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
}

let lastMove = 0;
const moveDelay = 100;
let grow = false;

function update(time = 0) {
  if (time - lastMove > moveDelay) {
    lastMove = time
    const head = {
      x: snake.body[0].x + snake.dx,
      y: snake.body[0].y + snake.dy
    }
    snake.body.unshift(head);
    
    if (
     head.x === food.x && head.y === food.y
    ) {
      randomFood();
      grow = true
    } 
    
    if (!grow) {
      snake.body.pop();
    } else {
      grow = false
    }
    
    if (
      head.y < 0 ||
      head.x < 0 ||
      head.x >= board.size ||
      head.y >= board.size
    ) {
      alert("Game Over!");
      snake.body = [{ x: 200, y: 200 }]
      snake.dx = 0;
      snake.dy = 0;
      
      randomFood();
    }
  }
  
  gameBoard();
  snakeDraw(ctx, snake, board);
  foodDraw(ctx, board, food);
  titleDraw(ctx, board);
  
  requestAnimationFrame(update)
}

resizeCanvas()
randomFood()
buttonMove(snake)
update();

window.addEventListener("keydown", (e) => snakeMove(e, snake))
window.addEventListener("resize", resizeCanvas);