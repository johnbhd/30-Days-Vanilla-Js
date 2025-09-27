const rps = (p1, p2) => {
  const rules = {
    scissors: "paper",
    rock: "scissors",
    paper: "rock"
  }
  if (p1 !== p2) {
    if (rules[p1] == p2) {
      return "Player 1 won!"
    } else {
      return "Player 2 won!"
    }
  } else {
    return "Draw!"
  }
  
}; 

console.log(rps("scissors", "paper"))

// Result: Player 1 won! - 9/26/25 9:09pm
