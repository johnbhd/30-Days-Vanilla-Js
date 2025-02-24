import { Pcontent } from "./p.js";

export function But() {
    const but = document.createElement('button');
    const p = Pcontent();
    p.innerHTML = "Hello, I'm JB Villegas";
    but.innerHTML = "Click For Role";
    
    //style
    but.style.padding = '20px 50px';
    but.style.fontSize = '30px';
    but.style.borderRadius = '20px';
    but.style.backgroundColor = 'blue';
    but.style.color = 'white';
    but.style.cursor = 'pointer';

    const context = [
        "Hello, I'm JB Villegas",
        "A Frontend Developer",
        "Click For Role",
        "Click For Name"
    ]

    // P content change 
    but.addEventListener('click', () => {
        document.body.style.backgroundColor = 
        document.body.style.backgroundColor === 'black' ? 'white' : 'black';

        p.innerHTML = p.innerHTML ===  context[0] ?  context[1] : context[0];
        p.style.color =
        p.style.color === 'white' ? 'black' : 'white';

        but.style.backgroundColor =
        but.style.backgroundColor === 'blue' ? 'red' : 'blue';

        but.innerHTML = but.innerHTML === context[2] ? context[3] : context[2];
    })

    return { but, p };
}   