const player = document.getElementById('player');
const computer = document.getElementById('computer');
const choices = document.querySelector('.choices');
const title = document.querySelector('h2');
const vs = document.querySelector('.vs');

const Pscore = document.getElementById('pscore');
const Cscore = document.getElementById('cscore');
const Tscore = document.getElementById('tscore');

vs.style.display = 'none';

let PlayerScore = 0;
let ComputerScore = 0;
let TieScore = 0
const getChoices = getGameChoices();

function getGameChoices() {
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
            img: ["https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/scissor2.png", "https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/scissor1.png"]
        }
    ];
  return pick;
}

getChoices.forEach((picker) => {
    const img = document.createElement('img');
    img.src = picker.img[0];
    img.alt = picker.choice;
    img.addEventListener('click', () => PlayerChoice(picker.img[0]));
    choices.appendChild(img);
    
});
function PlayerChoice(picker) {
    player.innerHTML = `
          <img id="imgPickP" src="${picker}">
    `;
    
    vs.style.display = 'block';
    const playerIndex = getChoices.find(items => items.img.includes(picker));
    
    const result = getResult(playerIndex.choice, ComputerChoice());
    Pscore.innerHTML = PlayerScore;
    Cscore.innerHTML = ComputerScore;
    Tscore.innerHTML = TieScore;
 

}

function ComputerChoice() {
    let randomBot = Math.floor(Math.random() * getChoices.length);
    const randomPick = getChoices[randomBot].img[1];

    computer.innerHTML = `
          <img id="imgPickC" src="${randomPick}">
    `;
    const computerIndex = getChoices.find(items => items.img.includes(randomPick));

    return computerIndex.choice;
}

function getResult(playerChoice, computerChoice) {
    const rules = {
        bato: "gunting",
        gunting: "papel",
        papel: "bato"
    }
    if (playerChoice === computerChoice) {
        TieScore++;
        title.innerText = "Tie";
    } else if (rules[playerChoice] === computerChoice) {
        PlayerScore++;
        title.innerText = "Player Wins";
    } else {
        ComputerScore++;
        title.innerText = "Computer Wins";
    }

}
