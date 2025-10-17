import { resizeCanvas, setupCanvas, isMobilePortrait } from "./resize.js";
import { handleKeyboard, handleTouch } from "./controls.js";
import { drawPaddle, clearScreen } from "./draw.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let paddleWidth = 20;
let paddleHeight = 110;
let playerX, playerY, opponentX, opponentY;
let paddleSpeed = 6;
let playerDir = 0;
let opponentDir = -1;
let controlsBound = false;

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
}

window.addEventListener("resize", setup);
setup();

function gameloop() {
  clearScreen(ctx, canvas);
  const portrait = isMobilePortrait(canvas);

  // Player movement
  if (portrait) {
    playerX += paddleSpeed * playerDir;
    if (playerX < 0) playerDir = 1;
    if (playerX + paddleWidth > canvas.width) playerDir = -1;
  } else {
    playerY += paddleSpeed * playerDir;
    if (playerY < 0) playerDir = 1;
    if (playerY + paddleHeight >= canvas.height) playerDir = -1;
  }

  // Opponent movement
  if (portrait) {
    opponentX += paddleSpeed * opponentDir;
    if (opponentX <= 0) opponentDir = 1;
    if (opponentX + paddleWidth >= canvas.width) opponentDir = -1;
  } else {
    opponentY += paddleSpeed * opponentDir;
    if (opponentY <= 0) opponentDir = 1;
    if (opponentY + paddleHeight >= canvas.height) opponentDir = -1;
  }

  drawPaddle(ctx, playerX, playerY, paddleWidth, paddleHeight);
  drawPaddle(ctx, opponentX, opponentY, paddleWidth, paddleHeight);

  requestAnimationFrame(gameloop);
}

gameloop();
