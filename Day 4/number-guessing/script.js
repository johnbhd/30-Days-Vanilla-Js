// range
const rangeBut = document.getElementById('rangeBut');
const startnum = document.getElementById('startNum');
const endnum = document.getElementById('endNum');
// output
const submit = document.getElementById('submit');
const restart = document.getElementById('restart');
const guess = document.getElementById('guess');
const message = document.getElementById('messageSpan');

let randomnum = 0, startval = 1, endval = 10, attempts = 0;

// range click
function rangeToggle() {
    startval = parseInt(startnum.value);
    endval = parseInt(endnum.value);
    
    attempts = 0;
    
    
    guess.placeholder = `Enter a Number (${startval}-${endval})`;
    message.textContent = `Guess a number between ${startval} and ${endval}`;
}

function submitGuess() {
    const userGuess = parseInt(guess.value);
    
    if (isNaN(userGuess)) {
        message.textContent = `Enter a Number(${startval}-${endval})`;
        return;
    }
    
    if (userGuess < startval || userGuess > endval) {
        message.textContent = `Your guess is out of range! (${startval}-${endval})`;
    } else if (userGuess === randomnum) {
        message.textContent = `🎉 Correct! You guessed the number in ${attempts} attempts.`;
    } else if (userGuess < randomnum) {
        message.textContent = '📉 Too low! Try again.';
        attempts++;
    } else {
        message.textContent = '📈 Too high! Try again.';
        attempts++;
    }
    console.log(`start: ${startval}`);
    console.log(`end: ${endval}`);
    
    console.log(`randomnum: ${randomnum}`);
    console.log(`Guess: ${userGuess}`);
    console.log(`attempt: ${attempts}`);
    
    
}
randomnum = Math.floor(Math.random() * (endval - startval + 1)) + startval;
function restartToggle() {
    attempts = 0;
    randomnum = Math.floor(Math.random() * (endval - startval + 1)) + startval;
    message.textContent = "Game reset! Set a new range.";
    guess.value = "";
}

rangeBut.addEventListener('click', rangeToggle);
submit.addEventListener('click', submitGuess);
restart.addEventListener('click', restartToggle);
