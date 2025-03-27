const input = document.getElementById('inputNum');
const clear = document.getElementById('clear');
const form = document.getElementById('form');

const result = document.getElementById('result');
const calculation = document.getElementById('calculation');

function Result(n) {
    let i = 2;
    let calval = "Answer: \n"

    if (n <= 1) {
        result.value = "Neither";
        calval += `${n} is neither prime nor composite.`

    } else {
        let isPrime = true;
        let factors = [];

        while (i <= n) {
            if (n % i == 0) {
                factors.push(i);
                if (i !== 1 && i !== n) {
                    isPrime = false;
                }
            } 
            i++;
        }
        if (isPrime) {

            result.value = "Prime";
            calval += `${n} is a prime number because it has no divisors other than 1 and itself. 
\nThe only factors of ${n} are: \n1 and ${factors.join(', ')}`;
        } else {
            result.value = "Composite";
            calval += `${n} is a composite number because it can be divided exactly by numbers other than 1 and itself. 
\nHere are all the factors of ${n}: \n1, ${factors.join(', ')}`;
        }
    }  
        calculation.textContent = calval;
                    
}

function Calculate(events) {
    events.preventDefault();
    let inputval = parseInt(input.value);
    
    Result(inputval);
}
function Clear() {
    input.value = "";
    result.value = "";
    calculation.textContent = "";
}

clear.addEventListener('click', Clear);
form.addEventListener('submit', Calculate);