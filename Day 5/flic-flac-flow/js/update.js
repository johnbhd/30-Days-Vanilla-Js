class FlicFlacFlow {
  constructor() {
    // this. is a encapsulation
    
    this.DOM = {
      boardCon: document.getElementById("tictactoe"),
      message: document.getElementById('message'),
      stars: document.querySelector('.stars'),
      player1Score: document.getElementById('player1-score'),
      player2Score: document.getElementById('player2-score'),  
      tieScore: document.getElementById('tie')
    }

    this.sizeBoard = 3;
    this.player = ["X", "O"];
    this.currentPlayer = this.player[0];
    this.gameover = false
    this.moves = { X: [], O: [] }
    this.gameScore = { X: 0, O: 0, tie: 0 }

    this.winnerCombo = [
        [1, 2, 3], [4, 5, 6], [7, 8, 9],
        [1, 4, 7], [2, 5, 8], [3, 6, 9],
        [1, 5, 9], [7, 5, 3]
    ];

    this.init() // calling function 
  }

}


const tictacDiv = document.getElementById("tictactoe");
const message = document.getElementById('message');
const stars = document.querySelector('.stars');
const player1Score = document.getElementById('player1-score');
const player2Score = document.getElementById('player2-score');
const tieScore = document.getElementById('tie');

const sizeBoard = 3;
const empty = "&nbsp";
message.textContent = "Flic Flac Flow";

let scores;
let count = 1;
let playerVal = ["", ""]
let player = ["X", "O"];
let currentPlayer = player[0];
let gameover = false;
let moveX = [];
let moveY = [];
let gameScore = {
  player1: 0,
  player2: 0,
  tie: 0
}
const playerInput = () => {
  playerVal = [
      document.getElementById("player1-char").value,
      document.getElementById("player2-char").value,
  ]
  player = [playerVal[0] || "X", playerVal[1] || "O"];
  currentPlayer = playerVal[0];
  console.log(playerVal)
}

["player1-char", "player2-char"].forEach(id => {
  document.getElementById(id).addEventListener("input", playerInput)
})

// rules
const winnerCombo = [
    [1, 2, 3],
    [4, 5, 6], 
    [7, 8, 9],
    [1, 4, 7],
    [2, 5, 8], 
    [3, 6, 9],
    [1, 5, 9],
    [7, 5, 3]
];

//star
for (let i = 0; i < 20; i++) {
  const star = document.createElement('div');
  star.classList.add('star');
  stars.appendChild(star);
}

// main board
function BoardGame() {
  const board = document.createElement("table");
  
  board.style.border = "1px solid white";
  board.style.height = "50vh";
  board.style.width = "50vh";
  board.style.borderCollapse = "collapse"
  
  for(let i = 0; i < sizeBoard; i++) {
    const row = document.createElement("tr");
    
    for (let j = 0; j < sizeBoard; j++) {
      const cell = document.createElement("td");

      cell.style.border = "1px solid white";
      cell.style.color = "white";
      cell.style.width = "60px";
      cell.style.height = "60px";
      cell.style.textAlign = "center";
      cell.style.verticalAlign = "middle";
      cell.style.fontSize = "3rem";
      cell.style.fontFamily = "Roboto, Arial";
      
   
      cell.dataset.row = i;
      cell.dataset.col = j;   
      cell.dataset.index = count;

      cell.addEventListener("click", ClickHandle);
      row.appendChild(cell);
      count++;
    }
    board.appendChild(row);
  }
  tictacDiv.appendChild(board);
}

// winner
function CheckWinner(playerMoves) {
  for (let i = 0; i < winnerCombo.length; i++) {
    const [a, b, c] = winnerCombo[i];

    if (playerMoves.includes(a) && playerMoves.includes(b) && playerMoves.includes(c)) 
      return [a, b, c]; 
  }
}

// tie
function CheckTie(x, y) {
    if (x.length + y.length === 9) {
       gameScore.tie++;
       tieScore.textContent = gameScore.tie;
       return true;
    }
}
// restart
function gameRestart() {
  const cells = document.querySelectorAll('td');
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove('highlight');
    cell.classList.remove('dimmed');
  });
    
  moveX = [];
  moveY = [];
  currentPlayer = player[0];
  gameover = false;
  message.textContent = "Flic Flac Flow";
  document.getElementById("player1-char").readOnly = false;
  document.getElementById("player2-char").readOnly = false;
  
}

// highlight winner
function highlightWinner(winner) {
  const cells = document.querySelectorAll('td');

  cells.forEach(cell => {
    const indexs = Number(cell.dataset.index);

    if (winner.includes(indexs)) {
      cell.classList.add('highlight');
    } else {
      cell.classList.add('dimmed')
    }
  })
}
// game score
function gameScoring() {
  if (currentPlayer === player[0]) {
    gameScore.player1++
    player1Score.textContent = gameScore.player1;
  } else {
    gameScore.player2++
    player2Score.textContent = gameScore.player2;
  }
}

// onclick cell 
function ClickHandle(e) {
  const row = e.target.dataset.row;
  const col = e.target.dataset.col;
  const index = Number(e.target.dataset.index);
  document.getElementById("player1-char").readOnly = true;
  document.getElementById("player2-char").readOnly = true;
  
  if (gameover) {
    gameRestart();
    return;
  }
  if (e.target.textContent !== "") return;
  
  e.target.textContent = currentPlayer; 
  
  const moves = currentPlayer === player[0] ? moveX : moveY;
  moves.push(index);

  const winningTiles = CheckWinner(moves);
  
  if (winningTiles) {
    highlightWinner(winningTiles);
    message.textContent = `The winner is player ${currentPlayer}!`;
    gameover = true;
    gameScoring()
    return;
  }
  
  if (CheckTie(moveX, moveY)) {
    message.textContent = `Game Tie!`;
    gameover = true;
    return;
  }
  currentPlayer = currentPlayer === player[0] ? player[1] : player[0];
  message.textContent = `${currentPlayer}'s Turn!`;
  
}

BoardGame();