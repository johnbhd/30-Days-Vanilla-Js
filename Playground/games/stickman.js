<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mobile Friendly Stickman</title>
<style>
  body {
    margin: 0;
    background-color: #222;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  canvas {
    background-color: #333;
    touch-action: none;
  }
  .controls {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, 60px);
    grid-template-rows: repeat(2, 60px);
    gap: 10px;
  }
  .btn {
    background-color: #0f0;
    border: none;
    border-radius: 10px;
    font-size: 24px;
    color: #000;
    touch-action: none;
  }
</style>
</head>
<body>
<canvas id="gameCanvas" width="400" height="500"></canvas>

<div class="controls">
  <div></div>
  <button class="btn" id="up">↑</button>
  <div></div>
  <button class="btn" id="left">←</button>
  <div></div>
  <button class="btn" id="right">→</button>
  <div></div>
  <button class="btn" id="down">↓</button>
  <div></div>
</div>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const stickman = {
  x: canvas.width/2,
  y: canvas.height/2,
  width: 20,
  height: 60,
  speed: 5,
  headImg: null
};

// Optional: load head image
const headImage = new Image();
headImage.src = ''; // put image URL if needed
headImage.onload = () => stickman.headImg = headImage;

// Control state
const keys = {};

// Arrow key listeners
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Mobile buttons
['up','down','left','right'].forEach(dir => {
  const btn = document.getElementById(dir);
  btn.addEventListener('touchstart', e => { keys['Arrow'+dir.charAt(0).toUpperCase()+dir.slice(1)] = true; e.preventDefault(); });
  btn.addEventListener('touchend', e => { keys['Arrow'+dir.charAt(0).toUpperCase()+dir.slice(1)] = false; e.preventDefault(); });
});

// Draw stickman
function drawStickman() {
  const {x, y, width, height, headImg} = stickman;
  const headRadius = 15;

  if(headImg){
    ctx.drawImage(headImg, x - headRadius, y - height/2 - headRadius*2, headRadius*2, headRadius*2);
  } else {
    ctx.beginPath();
    ctx.arc(x, y - height/2, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0';
    ctx.fill();
  }

  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 3;

  // Body
  ctx.beginPath();
  ctx.moveTo(x, y - height/2 + headRadius);
  ctx.lineTo(x, y + height/2);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(x, y - height/4);
  ctx.lineTo(x - 20, y);
  ctx.moveTo(x, y - height/4);
  ctx.lineTo(x + 20, y);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(x, y + height/2);
  ctx.lineTo(x - 15, y + height/2 + 20);
  ctx.moveTo(x, y + height/2);
  ctx.lineTo(x + 15, y + height/2 + 20);
  ctx.stroke();
}

// Update position
function update() {
  if(keys['ArrowUp']) stickman.y -= stickman.speed;
  if(keys['ArrowDown']) stickman.y += stickman.speed;
  if(keys['ArrowLeft']) stickman.x -= stickman.speed;
  if(keys['ArrowRight']) stickman.x += stickman.speed;

  // Keep inside canvas
  stickman.x = Math.max(20, Math.min(canvas.width - 20, stickman.x));
  stickman.y = Math.max(30, Math.min(canvas.height - 40, stickman.y));
}

// Animation loop
function loop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  update();
  drawStickman();
  requestAnimationFrame(loop);
}

loop();
</script>
</body>
</html>

const ctx = canvas.getContext('2d');

const stickman = {
  x: canvas.width/2,
  y: canvas.height/2,
  width: 20,
  height: 20,
  speed: 5,
  headImg: null
};

// Optional: load head image
const headImage = new Image();
headImage.src = 'https://res.cloudinary.com/dkqx7uzjx/image/upload/v1757259254/IMG_20250907_232617_ywtxex.png'; // put image URL if needed
headImage.onload = () => stickman.headImg = headImage;

// Control state
const keys = {};

// Arrow key listeners
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Mobile buttons
['up','down','left','right'].forEach(dir => {
  const btn = document.getElementById(dir);
  btn.addEventListener('touchstart', e => { keys['Arrow'+dir.charAt(0).toUpperCase()+dir.slice(1)] = true; e.preventDefault(); });
  btn.addEventListener('touchend', e => { keys['Arrow'+dir.charAt(0).toUpperCase()+dir.slice(1)] = false; e.preventDefault(); });
});

// Draw stickman
function drawStickman() {
  const {x, y, width, height, headImg} = stickman;
  const headRadius = 15;

  if(headImg){
    ctx.drawImage(headImg, x - headRadius, y - height/2 - headRadius*2, headRadius*2, headRadius*2);
  } else {
    ctx.beginPath();
    ctx.arc(x, y - height/2, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0';
    ctx.fill();
  }

  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 3;

  // Body
  ctx.beginPath();
  ctx.moveTo(x, y - height/2 + headRadius);
  ctx.lineTo(x, y + height/2);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(x, y - height/4);
  ctx.lineTo(x - 20, y);
  ctx.moveTo(x, y - height/4);
  ctx.lineTo(x + 20, y);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(x, y + height/2);
  ctx.lineTo(x - 15, y + height/2 + 20);
  ctx.moveTo(x, y + height/2);
  ctx.lineTo(x + 15, y + height/2 + 20);
  ctx.stroke();
}

// Update position
function update() {
  if(keys['ArrowUp']) stickman.y -= stickman.speed;
  if(keys['ArrowDown']) stickman.y += stickman.speed;
  if(keys['ArrowLeft']) stickman.x -= stickman.speed;
  if(keys['ArrowRight']) stickman.x += stickman.speed;

  // Keep inside canvas
  stickman.x = Math.max(20, Math.min(canvas.width - 20, stickman.x));
  stickman.y = Math.max(30, Math.min(canvas.height - 40, stickman.y));
}

// Animation loop
function loop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  update();
  drawStickman();
  requestAnimationFrame(loop);
}

loop();
</script>
</body>
</html>
