const form = document.getElementById('Myform');
const results = document.getElementById('results');
const tbody = document.getElementById('tbody');

const Result = (InputNum, RangeNum, operator) => {
    const num1 = Number(InputNum);
    let num2 = Number(RangeNum);

    tbody.innerHTML = '';
    
    for (let i = 0; i < 11; i++) {
        num2 = Number(RangeNum) + i;

        const operation = {
            '+': num1 + num2,
            '-': num1 - num2,
            '*': num1 * num2,
            '/': num2 !== 0 ? (num1 / num2).toFixed(2) : 'error'
        }
        const calculation = operation[operator] ?? 'Invalid';
    
        const calResult = `<tr>
            <td>${num1}</td>
            <td>${operator}</td>
            <td>${num2}</td>
            <td>=</td>
            <td>${calculation}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', calResult);
    }

}

const Calculation = (event) => {
    event.preventDefault();

    const InputNum = document.getElementById('InputNum').value;
    const RangeNum = document.getElementById('RangeNum').value;
    const operator = document.getElementById('select').value;

    results.style.display = 'block';
    Result(InputNum, RangeNum, operator);
}

form.addEventListener('submit', Calculation);