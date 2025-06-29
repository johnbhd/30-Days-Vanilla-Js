 const tictacDiv = document.getElementById("tictactoe");
  const message = document.getElementById('message');
  const sizeBoard = 3;
  const empty = "&nbsp";
  
  let scores;
  let count = 1;
  let player = ['X', 'O'];
  let currentPlayer = player[0];
  let gameover = false;
  let moveX = [];
  let moveY = [];
  
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

  function CheckWinner(playerMoves) {
    for (let i = 0; i < winnerCombo.length; i++) {
      const [a, b, c] = winnerCombo[i];

      if (playerMoves.includes(a) && playerMoves.includes(b) && playerMoves.includes(c)) 
        return true; 
    }
  }
  function CheckTie(x, y) {
      if (x.length + y.length === 9) {
         return true;
      }
  }
  function gameRestart() {
    const cells = document.querySelectorAll('td');
    cells.forEach(cell => {
      cell.textContent = "";
    });
      
    moveX = [];
    moveY = [];
    currentPlayer = player[0];
    gameover = false;
    message.textContent = "";
  }

  function ClickHandle(e) {
    const row = e.target.dataset.row;
    const col = e.target.dataset.col;
    const index = Number(e.target.dataset.index);
    
    if (gameover) {
      gameRestart();
      return;
    }
    if (e.target.textContent !== "") return;
    
    e.target.textContent = currentPlayer; 
    
    const moves = currentPlayer === player[0] ? moveX : moveY;
    moves.push(index);
    
    if (CheckWinner(moves)) {
      message.textContent = `The winner is player ${currentPlayer}!`;
      gameover = true;
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