const player = document.getElementById('player');
const computer = document.getElementById('computer');
const choices = document.querySelector('.choices');
const title = document.querySelector('h2');
const vs = document.querySelector('.vs');

const Pscore = document.getElementById('pscore');
const Cscore = document.getElementById('cscore');
const Tscore = document.getElementById('tscore');

const defaultPick = ["https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/rock1.png", "https://raw.githubusercontent.com/jbmvdev/img-host/main/pick/rock2.png"];

vs.style.display = 'none';

let PlayerScore = 0;
let ComputerScore = 0;
let TieScore = 0

const getChoices = getGameChoices();

player.innerHTML = `
        <img src="${defaultPick[0]}" class='imgPC'>
`;
computer.innerHTML = `
        <img src="${defaultPick[1]}" class='imgPC'>
`;

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
    const playerIndex = getChoices.find(items => items.img.includes(picker));

    let randomBot = Math.floor(Math.random() * getChoices.length);
    const computerData = getChoices[randomBot];

    player.innerHTML = `
          <img id="imgPickP" src="${defaultPick[0]}">
    `;
    computer.innerHTML = `
          <img id="imgPickC" src="${defaultPick[1]}">
    `;
    
    vs.style.display = 'block';
    title.innerText = "Bato... Bato... Pick!";
    title.style.color = '';

    choices.style.display = 'none';

    setTimeout(() => {
        player.innerHTML = `
          <img class="imgP" src="${picker}">
        `;
        computer.innerHTML = `
         <img class="imgC" src="${computerData.img[1]}">
        `;
        
        getResult(playerIndex.choice, computerData.choice);

        Pscore.innerHTML = PlayerScore;
        Cscore.innerHTML = ComputerScore;
        Tscore.innerHTML = TieScore;
        
        choices.style.display = 'flex';
    }, 2500); 

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
        title.innerText = "Player Wins!";
        title.style.color = '#88ff8a';
    } else {
        ComputerScore++;
        title.innerText = "Computer Wins!";
        title.style.color = '	#e74c3c'
    }
    
}
