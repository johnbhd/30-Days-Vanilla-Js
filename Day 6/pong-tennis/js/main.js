import { resizeCanvas, setupCanvas, isMobilePortrait } from "./resize.js";
import { handleKeyboard, handleTouch } from "./controls.js";
import { drawPaddle, clearScreen, lineDivide, drawGameScore } from "./draw.js";
import { drawBall, updateBall, ball, setScoreCallbacks } from "./ball.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let paddleWidth = 20;
let paddleHeight = 110;
let playerX, playerY, opponentX, opponentY;
let paddleSpeed = 6;
let playerDir = 0;
let opponentDir = -1;
let controlsBound = false;

// Scores
let playerScore = 0;
let opponentScore = 0;

// CANVAS SETUP
function setup() {
  const portrait = resizeCanvas(canvas);
  setupCanvas(canvas, portrait);

  if (portrait) {
    paddleWidth = 110;
    paddleHeight = 20;
    playerX = canvas.width / 2 - paddleWidth / 2;
    playerY = canvas.height - paddleHeight - 10;
    opponentX = canvas.width / 2 - paddleWidth / 2;
    opponentY = 10;
  } else {
    paddleWidth = 20;
    paddleHeight = 110;
    playerX = 100;
    playerY = canvas.height / 2 - paddleHeight / 2;
    opponentX = canvas.width - paddleWidth - 100;
    opponentY = canvas.height / 2 - paddleHeight / 2;
  }

  if (!controlsBound) {
    handleKeyboard((dir) => (playerDir = dir));
    handleTouch(canvas, portrait, (dir) => (playerDir = dir));
    controlsBound = true;
  }

  // Reset ball position after canvas setup
  ball.x = canvas.width / 2 - ball.width / 2;
  ball.y = canvas.height / 2 - ball.height / 2;
  ball.paused = false;
}

window.addEventListener("resize", setup);
setup();

// Set up score callbacks
setScoreCallbacks(
  () => playerScore++,  
  () => opponentScore++ 
);

// MAIN GAME LOOP
function gameloop() {
  const portrait = isMobilePortrait(canvas);

  if (portrait) {
    playerX += paddleSpeed * playerDir;
    playerX = Math.max(0, Math.min(playerX, canvas.width - paddleWidth));
  } else {
    playerY += paddleSpeed * playerDir;
    playerY = Math.max(0, Math.min(playerY, canvas.height - paddleHeight));
  }
  

  if (portrait) {
    opponentX += paddleSpeed * opponentDir;
    if (opponentX <= 0) opponentDir = 1;
    if (opponentX + paddleWidth >= canvas.width) opponentDir = -1;
    opponentX = Math.max(0, Math.min(opponentX, canvas.width - paddleWidth));
  } else {
    opponentY += paddleSpeed * opponentDir;
    if (opponentY <= 0) opponentDir = 1;
    if (opponentY + paddleHeight >= canvas.height) opponentDir = -1;
    opponentY = Math.max(0, Math.min(opponentY, canvas.height - paddleHeight));
  }

  updateBall(canvas, playerX, playerY, opponentX, opponentY, paddleWidth, paddleHeight, portrait);

  // Drawing
  clearScreen(ctx, canvas);
  drawPaddle(ctx, playerX, playerY, paddleWidth, paddleHeight);
  drawPaddle(ctx, opponentX, opponentY, paddleWidth, paddleHeight);
  lineDivide(ctx, canvas, portrait);
  drawGameScore(ctx, canvas, playerScore, opponentScore, portrait);
  drawBall(ctx);
  
  requestAnimationFrame(gameloop);
}

gameloop();