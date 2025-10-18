const images = [
  "../assets/volleyball.png",
  "../assets/basketball.png",
  "../assets/au.png",
  "../assets/tennis.png",
];

let currentImageIndex = 0;
const img = new Image();
img.src = images[currentImageIndex];

const ball = {
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
  let hitPaddle = false;

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

  // Ball went out of bounds (no paddle hit)
  if (!hitPaddle) {
    if (
      (portrait && (ball.y < 0 || ball.y + ball.height > canvas.height)) ||
      (!portrait && (ball.x < 0 || ball.x + ball.width > canvas.width))
    ) {
      ball.paused = true;
      ball.speedX = 0;
      ball.speedY = 0;

      setTimeout(() => {
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
        nextImage();
      }, 1000);
    }
  }
}