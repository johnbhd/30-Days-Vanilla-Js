class FlicFlacFlow {
  constructor() {
    // this. is a encapsulation
    // constructor called method
    this.DOM = {
      boardCon: document.getElementById("tictactoe"),
      message: document.getElementById('message'),
      stars: document.querySelector('.stars'),
      player1Score: document.getElementById('player1-score'),
      player2Score: document.getElementById('player2-score'),  
      tieScore: document.getElementById('tie'),
      playerChar1: document.getElementById("player1-char"),
      playerChar2: document.getElementById("player2-char"),
      player1Label: document.getElementById("player1-label"),
      player2Label: document.getElementById("player2-label"),
    }

    this.winnerCombo = [
        [1, 2, 3], [4, 5, 6], [7, 8, 9],
        [1, 4, 7], [2, 5, 8], [3, 6, 9],
        [1, 5, 9], [7, 5, 3]
    ];

    this.sizeBoard = 3;
    this.count = 1;
    this.playerVal = ["X", "O"];
    this.player = ["X", "O"];
    this.playerLabel = ["Player", "Computer"]
    this.currentPlayer = this.player[0];
    this.gameover = false;
    this.moveX = [];
    this.moveY = [];
    this.gameScore = { player1: 0, player2: 0, tie: 0 };

    this.init() // calling function 
  }
  init() {
    this.setupEventListener()
    this.updatePlayer()
    this.createStar()
    this.createBoard()
  }
  
  // LOCAL STORAGE
  setDataLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  getDataLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  setupEventListener() {
    [this.DOM.player1Label, this.DOM.player2Label].forEach((el, index) => {
      el.addEventListener("click", () => {
          const newLabel = el.textContent = el.textContent === this.playerLabel[0] 
            ? this.playerLabel[1]  
            : this.playerLabel[0];
          el.textContent = newLabel;
          this.setDataLocalStorage(`Player${index + 1 }`, newLabel);
      })
    })
  }

  updatePlayer() {
    this.playerVal = [
      this.DOM.playerChar1.value  || "X",
      this.DOM.playerChar2.value || "O",
    ]
    this.player = [this.playerVal[0], this.playerVal[1]];
    this.currentPlayer = this.playerVal[0];

    [this.DOM.playerChar1, this.DOM.playerChar2].forEach(el => {
      el.addEventListener("input", this.updatePlayer.bind(this));
    })

  }

  createStar() {
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      this.DOM.stars.appendChild(star);
    }
  }

  createBoard() {
    const board = document.createElement("table");
    board.style.border = "1px solid white";
    board.style.height = "50vh";
    board.style.width = "50vh";
    board.style.borderCollapse = "collapse"
    
    for(let i = 0; i < this.sizeBoard; i++) {
      const row = document.createElement("tr");   
      for (let j = 0; j < this.sizeBoard; j++) {
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
        cell.dataset.index = this.count;

        cell.addEventListener("click", this.ClickHandle.bind(this));
        row.appendChild(cell);
        this.count++;
      }
      board.appendChild(row);
    }
    this.DOM.message.textContent = "Flic Flac Flow";
    this.DOM.boardCon.appendChild(board);
  }
  CheckWinner(playerMoves) {
    for (let i = 0; i < this.winnerCombo.length; i++) {
    const [a, b, c] = this.winnerCombo[i];

    if (playerMoves.includes(a) && playerMoves.includes(b) && playerMoves.includes(c))
      return [a, b, c]; 
    }
  }

  CheckTie() {
    if (this.moveX.length + this.moveY.length === 9) {
      this.gameScore.tie++;
      this.DOM.tieScore.textContent = this.gameScore.tie;
      return true;
    }
    return false;
  }

  gameRestart() {
    const cells = document.querySelectorAll('td');
    cells.forEach(cell => {
      cell.textContent = "";
      cell.classList.remove('highlight');
      cell.classList.remove('dimmed');
    });
      
    this.moveX = [];
    this.moveY = [];
    this.currentPlayer = this.player[0];
    this.gameover = false;
    this.DOM.message.textContent = "Flic Flac Flow";
    this.DOM.playerChar1.readOnly = false;
    this.DOM.playerChar2.readOnly = false;
    
  }
  highlightWinner(winner) {
    const cells = document.querySelectorAll('td');

    cells.forEach(cell => {
      const indexs = Number(cell.dataset.index);

      if (winner.includes(indexs)) {
        cell.classList.add('highlight');
      } else {
        cell.classList.add('dimmed')
      }
    });
  }

  gameScoring() {
    if (this.currentPlayer === this.player[0]) {
      this.gameScore.player1++
      this.DOM.player1Score.textContent = this.gameScore.player1;
    } else {
      this.gameScore.player2++
      this.DOM.player2Score.textContent = this.gameScore.player2;
    }
  }

  ClickHandle(e) {
    this.setDataLocalStorage("PlayerChar", this.playerVal)
    const index = Number(e.target.dataset.index);
    this.DOM.playerChar1.readOnly = true;
    this.DOM.playerChar2.readOnly = true;
    
    if (this.gameover) {
      this.gameRestart();
      return;
    }
    if (e.target.textContent !== "") return;
    
    e.target.textContent = this.currentPlayer; 
    
    const moves = this.currentPlayer === this.player[0] ? this.moveX : this.moveY;
    moves.push(index);

    const winningTiles = this.CheckWinner(moves);
    
    if (winningTiles) {
      this.highlightWinner(winningTiles);
      this.DOM.message.textContent = `The winner is player ${this.currentPlayer}!`;
      this.gameover = true;
      this.gameScoring()
      return;
    }
    
    if (this.CheckTie()) {
      this.DOM.message.textContent = `Game Tie!`;
      this.gameover = true;
      return;
    }
    this.currentPlayer = this.currentPlayer === this.player[0] ? this.player[1] : this.player[0];
    this.DOM.message.textContent = `${this.currentPlayer}'s Turn!`;
    
  }
}

new FlicFlacFlow();
