const container = document.createElement('div');
const p = document.createElement('p');
const header = document.createElement('h2');
// container style
container.style.textAlign = 'center';
container.style.fontFamily = 'Arial';
container.style.fontSize = '30px '

// h2 content
header.innerHTML = 'Day 1: Types of Variable and Data';

// p content
let hello;
hello = "hi";
hello = "hi";

const num = 1;

var variable = "im a var";
variable = true;

const obj = {
    Names: 'jb',
    Age: '19',
    TechStack: 'Mern and Nexjs'
}

const ProgLang = [
    'Python', 
    'Java',
    'Javascript'
];

function HelloWorld() {
    console.log("Hello World");
}

const br = '<br>';

p.innerHTML = `Let: ${typeof hello} 
${br} Const: ${typeof num}
${br} Var: ${typeof variable}
${br} Objec: ${typeof obj}
${br} Array: ${typeof ProgLang}
${br} Function: ${typeof HelloWorld}
`
;



// appen created element
container.appendChild(header);
container.appendChild(p);

// appen created div
document.body.append(container);