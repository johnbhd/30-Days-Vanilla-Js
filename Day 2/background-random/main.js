import { Button } from "./button.js";

const container = document.createElement('div');
const {but, title} = Button();

// container style
container.style.display = 'flex';
container.style.flexDirection = 'column';
container.style.border = '2px black';
container.style.fontSize = '40px';
container.style.fontFamily = 'arial';
container.style.padding = '20px 20px'
container.style.backgroundColor = '#ebe6e6'
container.style.borderRadius = '20px'

// body style
document.body.style.display = 'flex';
document.body.style.alignItems = 'center';
document.body.style.justifyContent = 'center';
document.body.style.height = '100vh';
document.body.style.margin = '0px';
document.body.append(container);
container.appendChild(title);
container.appendChild(but);
