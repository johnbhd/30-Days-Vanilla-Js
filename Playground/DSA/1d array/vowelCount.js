// code it 11: 39pm 
// problem base on codechum dsa we java their but i like to use js 

// Test score checked by tropa(chatgpt)
// Correctness: 10/10
// Output Format: 8/10
// Clean Code: 9/10
// Overall Score: 9/10

// to run this install nodejs in computer and type "node vowelCount.js"

import readline from 'node:readline'; // import lib

// declaration readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const vowels = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'];
const maxChar = 8;
const chars = [];

console.log(`Enter ${maxChar} characters: `);

function askChar() {
    if (chars.length < maxChar) {
        rl.question("", input => {
            if (input.length !== 1) {
                console.log("Enter only 1 character at a time");
                askChar()
                
            } else {
                chars.push(input)
                askChar()
            }
        })
    } else {
        vowelCounts(chars.join("").split(""))
        rl.close()
    }
}

function vowelCounts(char) {
    const c = char.filter(chars => vowels.includes(chars))
    console.log(`Number of vowel elements: ${c.length}`)
}

askChar()