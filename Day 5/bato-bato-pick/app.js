const player = document.getElementById('player');
const computer = document.getElementById('computer');

const choices = [...document.querySelectorAll('button')];
const title = document.querySelector('h2');

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


