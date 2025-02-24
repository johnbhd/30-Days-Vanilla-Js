const cal = document.querySelectorAll('.buttons button');
const display = document.getElementById('display');
cal.forEach(button =>  {
    button.addEventListener('click', () => {
        const value = button.textContent;

        if (value === 'C') {
            display.value = '';
        } else if (value === '=') {
            display.value = eval(display.value);
        } else {
            display.value += value;
        }

        display.innerHTML = value;
    })
})