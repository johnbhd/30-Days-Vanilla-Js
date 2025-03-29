const generate = document.getElementById('generate');
const startNum = document.getElementById('startNum');
const endNum = document.getElementById('endNum');

const result = document.getElementById('result');

function calculation(n, z) {
    let sequence = [];

    for (let i = 0, a = 0, b = 1; i <= z; i++) {
        if (i >= n) sequence.push(a); 
        let temp = a + b;
        a = b;
        b = temp;
    }

    return sequence.length > 0 ? sequence.join(', ') : "No fibonacci numbers in range";
}

function Result() {
    let startval = parseInt(startNum.value);
    let endval = parseInt(endNum.value);

    result.textContent = calculation(startval, endval); 
}

generate.addEventListener('click', Result);
