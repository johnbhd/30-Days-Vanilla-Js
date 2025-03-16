const form = document.getElementById('form');


const copyText = (output) => {
    output.select();
    output.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(output.value);
    
    copy.textContent = 'Copy Text✔';
    setInterval(() => {
        copy.textContent = 'Copy Text';
    }, 1000);
}

const WordRepeat = (event, output) => {
    event.preventDefault();
    const textInput = document.getElementById('textInput').value;
    const countInput = document.getElementById('countInput').value;
    const outputDiv = document.getElementById('result');
  
    outputDiv.style.display = 'block';
    output.textContent = '';

    for (let i = 1; i <= countInput; i++) {
        output.textContent += `${textInput}\n`
    }
}

form.addEventListener('submit', (event) => {
    const output = document.getElementById('output');
    WordRepeat(event, output);
});

copy.addEventListener('click', () => {
    const copy = document.getElementById('copy');
    copyText(output);
})