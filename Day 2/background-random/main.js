import { Button } from "./button.js";

const container = document.createElement('div');
const {but, title} = Button();

// container style
container.style.display = 'flex';

container.style.flexDirection = 'column';
container.style.alignItems = 'center';
container.style.justifyContent = 'center';
container.style.height = '100vh';
container.style.fontSize = '60px';
container.style.fontFamily = 'arial';


document.body.style.margin = '0px';
document.body.append(container);
container.appendChild(title);
container.appendChild(but);
