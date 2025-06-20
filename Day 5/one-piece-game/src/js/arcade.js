const canvas = document.getElementById('game');
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1

const gamesWidth = 450;
const gamesHeight = 200; 


function resizeCanvas() {
    const scaleX = window.innerWidth / gamesWidth;
    const scaleY = window.innerHeight / gamesHeight;
    const scale = Math.min(scaleX, scaleY);
    
    canvas.width = gamesWidth * dpr;
    canvas.height = gamesHeight * dpr;
    
    canvas.style.width = gamesWidth * scale + "px";
    canvas.style.height = gamesHeight * scale + "px";
    canvas.style.border = "1px solid black"
    
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
}



window.addEventListener("resize", resizeCanvas);

resizeCanvas();
const playerImg = new Image();
playerImg.src = "../assets/gokusaiyan.png";

playerImg.onload = () => {
    drawCharacter()
}

const character = {
    x: 100,
    y: 10,
    width: 64, 
    height: 64,
    frameIndex: 0
}

function drawCharacter() {
    
    
    ctx.clearRect(0, 0, gamesWidth, gamesHeight);
    ctx.drawImage(
        playerImg,
        character.x,
        character.y,
        character.width,
        character.height
    )
  
}