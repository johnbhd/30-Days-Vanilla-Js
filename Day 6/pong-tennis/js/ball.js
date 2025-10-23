const images = [
  "./assets/volleyball.png",
  "./assets/basketball.png",
  "./assets/au.png",
  "./assets/tennis.png",
];

let currentImageIndex = 0;
const img = new Image();
img.onload = () => console.log("Loaded:", img.src);
img.onerror = () => console.error("Failed to load:", img.src);

img.src = images[currentImageIndex];

export const ball = {
  y: 150,
  x: 150,
  width: 40,
  height: 40,
  speedX: 3,
  speedY: 3,
  angle: 0,
  rotationSpeed: 0.1,
  paused: false,
  lastPortraitDirectionDown: true,
  lastLandscapeDirectionRight: true
};

// Export hitPaddle variable
export let hitPaddle = false;

// Add scoring callback functions
let onPlayerScore = () => {};
let onOpponentScore = () => {};

export function setScoreCallbacks(onPlayer, onOpponent) {
  onPlayerScore = onPlayer;
  onOpponentScore = onOpponent;
}

export function drawBall(ctx) {
  if (!img.complete) return;
  ctx.save();
  ctx.translate(ball.x + ball.width / 2, ball.y + ball.height / 2);
  ctx.rotate(ball.angle);
  ctx.drawImage(img, -ball.width / 2, -ball.height / 2, ball.width, ball.height);
  ctx.restore();
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % images.length;
  img.src = images[currentImageIndex];
}

export function updateBall(canvas, playerX, playerY, opponentX, opponentY, paddleWidth, paddleHeight, portrait) {
  if (ball.paused) return;

  // Reset hitPaddle at start of each update
  hitPaddle = false;

  // Move ball
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  // Rotate ball
  ball.angle += ball.rotationSpeed;

  // Bounce canvas sides
  if (portrait) {
    if (ball.x <= 0 || ball.x + ball.width >= canvas.width) {
      ball.speedX *= -1;
      ball.x = Math.max(0, Math.min(ball.x, canvas.width - ball.width));
    }
  } else {
    if (ball.y <= 0 || ball.y + ball.height >= canvas.height) {
      ball.speedY *= -1;
      ball.y = Math.max(0, Math.min(ball.y, canvas.height - ball.height));
    }
  }

  // Paddle collisions
  if (portrait) {
    // Portrait → bounce vertically
    // Player paddle (bottom)
    if (
      ball.y + ball.height >= playerY &&
      ball.y <= playerY + paddleHeight &&
      ball.x + ball.width > playerX &&
      ball.x < playerX + paddleWidth &&
      ball.speedY > 0 // Moving downward toward player paddle
    ) {
      ball.speedY = -Math.abs(ball.speedY); // bounce up
      ball.y = playerY - ball.height;
      hitPaddle = true;
    }

    // Opponent paddle (top)
    if (
      ball.y <= opponentY + paddleHeight &&
      ball.y + ball.height >= opponentY &&
      ball.x + ball.width > opponentX &&
      ball.x < opponentX + paddleWidth &&
      ball.speedY < 0 // Moving upward toward opponent paddle
    ) {
      ball.speedY = Math.abs(ball.speedY); // bounce down
      ball.y = opponentY + paddleHeight;
      hitPaddle = true;
    }
  } else {
    // Landscape → bounce horizontally
    // Player paddle (left)
    if (
      ball.x <= playerX + paddleWidth &&
      ball.x + ball.width >= playerX &&
      ball.y + ball.height > playerY &&
      ball.y < playerY + paddleHeight &&
      ball.speedX < 0 // Moving left toward player paddle
    ) {
      ball.speedX = Math.abs(ball.speedX); // bounce right
      ball.x = playerX + paddleWidth;
      hitPaddle = true;
    }

    // Opponent paddle (right)
    if (
      ball.x + ball.width >= opponentX &&
      ball.x <= opponentX + paddleWidth &&
      ball.y + ball.height > opponentY &&
      ball.y < opponentY + paddleHeight &&
      ball.speedX > 0 // Moving right toward opponent paddle
    ) {
      ball.speedX = -Math.abs(ball.speedX); // bounce left
      ball.x = opponentX - ball.width;
      hitPaddle = true;
    }
  }

  // Ball went out of bounds (no paddle hit) - SCORING LOGIC
  if (!hitPaddle) {
    let scored = false;
    
    if (portrait) {
      // Ball went past bottom - Opponent scores
      if (ball.y + ball.height > canvas.height) {
        onPlayerScore();
        scored = true;
      }
      // Ball went past top - Player scores
      else if (ball.y < 0) {
        onOpponentScore();
        scored = true;
      }
    } else {
      // Ball went past right - Opponent scores
      if (ball.x + ball.width > canvas.width) {
        onPlayerScore();
        scored = true;
      }
      // Ball went past left - Player scores
      else if (ball.x < 0) {
        onOpponentScore();
        scored = true;
      }
    }

    if (scored) {
      ball.paused = true;
      ball.speedX = 0;
      ball.speedY = 0;

      setTimeout(() => {
        resetBallPosition(canvas, portrait);
        nextImage();
      }, 1000);
    }
  }
}

function resetBallPosition(canvas, portrait) {
  // Reset to center
  ball.x = canvas.width / 2 - ball.width / 2;
  ball.y = canvas.height / 2 - ball.height / 2;

  if (portrait) {
    ball.speedY = ball.lastPortraitDirectionDown ? 3 : -3;
    ball.speedX = 3; // keep horizontal speed
    ball.lastPortraitDirectionDown = !ball.lastPortraitDirectionDown;
  } else {
    ball.speedX = ball.lastLandscapeDirectionRight ? 3 : -3;
    ball.speedY = 3; // keep vertical speed
    ball.lastLandscapeDirectionRight = !ball.lastLandscapeDirectionRight;
  }

  ball.paused = false;
}

export function resetBall(canvas, portrait) {
  resetBallPosition(canvas, portrait);
  ball.angle = 0;
}

export function setBallSpeed(speed) {
  const currentSpeedX = Math.abs(ball.speedX);
  const currentSpeedY = Math.abs(ball.speedY);
  
  ball.speedX = ball.speedX > 0 ? speed : -speed;
  ball.speedY = ball.speedY > 0 ? speed : -speed;
}