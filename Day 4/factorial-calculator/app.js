const input = document.getElementById("inputNum");
const result = document.getElementById("result");
const cal = document.getElementById("calculation");

function Calculation(formula) {
    cal.textContent = formula;
}

function Factorial(n) {
    let i, factorial = 1;
    let formula = `!${n} =`;
    for (i = 1; i <= n; i++) {
        factorial *= i;
        formula += i < n ? ` ${i} x ` : `${i}`;
    }
    formula += `\n\nAnswer: ${factorial}`
    Calculation(formula);
    
    return factorial;

}

function InputFunc() {
    let inputval = parseInt(input.value) ;
    
    let factor = Factorial(inputval);

    result.value = factor;
}
Calculation();
input.addEventListener("input", InputFunc);