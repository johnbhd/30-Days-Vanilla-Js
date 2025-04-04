function Fibonacci() {

    const generate = document.getElementById('generate');
    const startNum = document.getElementById('startNum');
    const endNum = document.getElementById('endNum');
    const calculation = document.getElementById('calculation');
    const calCon = document.querySelector('.wrapper');
    
    const result = document.getElementById('result');
    
    function Result(n, z) {
        let sequence = [];
    
        for (let i = 0, a = 0, b = 1; i <= z; i++) {
            if (i >= n) sequence.push(a); 
            let temp = a + b;
            a = b;
            b = temp;
        }
    
        return sequence.length > 0 ? sequence.join(', ') : "No fibonacci numbers in range";
    }
    
    
    function Cal(n, z) {
        let steps = [];
        let fib = [0, 1]; // store Fibonacci values as we go
        
        for (let i = 2; i <= z; i++) {
            fib[i] = fib[i - 1] + fib[i - 2];
        }
        
        for (let i = n; i <= z; i++) {
            if (i === 0) {
                steps.push(`F(0) = 0`);
            } else if (i === 1) {
                steps.push(`F(1) = 1`);
            } else {
                steps.push(`F(${i}) = F(${i - 1}) + F(${i - 2}) = ${fib[i - 1]} + ${fib[i - 2]} = ${fib[i]}`);
            }
        }
        
        return steps.join('\n');
    }
    function Display() {
        let startval = parseInt(startNum.value);
        let endval = parseInt(endNum.value);
    
        result.textContent = Result(startval, endval); 
        calculation.textContent = Cal(startval, endval);
        calCon.style.display = "block";
    }
    function displayList(steps) {
        calculation.innerHTML = ""; // clear
        const ul = document.createElement("ul");
        steps.forEach(step => {
            const li = document.createElement("li");
            li.textContent = step;
            ul.appendChild(li);
        });
        calculation.appendChild(ul);
    }
    
    function displayTable(steps) {
        calculation.innerHTML = ""; // clear
        const tbl = document.createElement("table");
        tbl.style.borderCollapse = "collapse";
        tbl.style.width = "100%";
    
        steps.forEach(step => {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.textContent = step;
            td.style.border = "1px solid #ccc";
            td.style.padding = "8px";
            tr.appendChild(td);
            tbl.appendChild(tr);
        });
    
        calculation.appendChild(tbl);
    }
    
    generate.addEventListener('click', Display);
}

function Imgs() {
    const goku = document.getElementById('goku');
    const gokusaiyan = document.getElementById('gokusaiyan');
    const vegeta = document.getElementById('vegeta');
    const pikolo = document.getElementById('pikolo');
    
    let index1 = 0;
    let index2 = 0;
    
    const dragonBall1 = [goku, gokusaiyan];
    const dragonBall2 = [vegeta, pikolo];

    function show() {
        [...dragonBall1, ...dragonBall2].forEach(img => {
            img.style.display = "none";
        });
        
        
        dragonBall1[index1].style.display = "block";
        dragonBall2[index2].style.display = "block";

        index1 = (index1 + 1) % dragonBall1.length; 
        index2 = (index2 + 1) % dragonBall2.length; 
    }

    show();

    setInterval(show, 5000);
}
Fibonacci();
Imgs();