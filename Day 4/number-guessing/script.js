// range
const rangeBut = document.getElementById('rangeBut');
const startnum = document.getElementById('startNum');
const endnum = document.getElementById('endNum');
// output
const submit = document.getElementById('submit');
const restart = document.getElementById('restart');
const guess = document.getElementById('guess');

// range click

const rangeToggle = () => {
    let startval = parseInt(startnum.value);
    let endval = parseInt(endnum.value);

    guess.placeholder = `Enter a Number(${startval}-${endval})`;

}

rangeBut.addEventListener('click', rangeToggle);