const player = document.getElementById('player');
const computer = document.getElementById('computer');
const choices = document.querySelector('.choices');
const title = document.querySelector('h2');

const pickChoices = Choices();

function Choices() {
    const pick = [
        {
            choice: "bato",
            img: ["https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/rock1.png", "https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/rock2.png"]
        },
        {
            choice: "papel",
            img: ["https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/paper1.png", "https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/paper2.png"]
        },
        {
            choice: "gunting",
            img: ["https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/scissor1.png", "https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/scissor2.png"]
        }
    ];
  return pick;
}

pickChoices.forEach((picker, index) => {
    choices.innerHTML += `
           <img src=${picker.img[0]} alt=${picker.choice} onclick=''>
    `;
    console.log(picker.img[0])
    console.log(picker.choice+ index);
    
    
});

function getResult(playerChoice, computerChoice) {
    if (playerChoice ===  computerChoice) return "Tie";
    if ((playerChoice + 1) % 3 === computerChoice) return "Computer Wins";
    return "Player Wins"
}
console.log(getResult(1, 2));



/*
function Referee(playerchoices, computerChoice) {
    const playerPick = playerchoices;
    const computerPick = computerChoice.textContent;
    
    player.textContent = playerPick;
    computer.textContent = computerPick;
    if (playerPick === computerPick) {
        title.textContent = 'tie';
        // Computer Wins
    } else if ((playerPick == "Gunting" && computerPick == "Bato") 
            || (playerPick == "Papel" && computerPick == "Gunting") 
            || (playerPick == "Bato" && computerPick == "Papel")) {
        title.textContent = (`Computer Wins: ${computerPick}, beats Player: ${playerPick}`);
    } else {
        title.textContent = (`Player Wins: ${playerPick}, Computer Player: ${computerPick}`);
    }
}
function ComputerChoice() {
    let randomBot = Math.floor(Math.random() * choices.length);
 
    return choices[randomBot];

}

choices.forEach(but => {
    but.addEventListener('click', () => {
        let playerchoices = but.value;
        let computerChoice = ComputerChoice();

        Referee(playerchoices, computerChoice);

    
    });
});
*/
