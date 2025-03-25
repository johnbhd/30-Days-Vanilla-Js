// range
const rangeBut = document.getElementById('rangeBut');
const startnum = document.getElementById('startNum');
const endnum = document.getElementById('endNum');
// output
const submit = document.getElementById('submit');
const restart = document.getElementById('restart');
const guess = document.getElementById('guess');
const message = document.getElementById('messageSpan');

let randomnum, startval = 1, endval = 10, attempts = 0;
// random num
function generateRandomNum() {
    randomnum = Math.floor(Math.random() * (endval - startval + 1)) + startval;
}
// range click
function rangeToggle() {
    startval = parseInt(startnum.value);
    endval = parseInt(endnum.value);
    
    attempts = 0;
    
    generateRandomNum();

    guess.placeholder = `Enter a Number (${startval}-${endval})`;
    message.textContent = `Guess a number between ${startval} and ${endval}`;
}
// user guess
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
}
// restart
function restartToggle() {
    attempts = 0;
    generateRandomNum();
    message.textContent = "Game reset! Set a new range.";
    guess.value = "";
}
// enter key
guess.addEventListener('keypress', (event) => {
    if (event.key === "Enter") {
        submit.click();
    }
})

rangeBut.addEventListener('click', rangeToggle);
submit.addEventListener('click', submitGuess);
restart.addEventListener('click', restartToggle);
generateRandomNum();