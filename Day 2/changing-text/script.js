import { But } from "./but.js";

const container = document.createElement('div');

const {but, p} = But();

// container style
container.style.display = 'flex';
container.style.flexDirection = 'column';
container.style.alignItems = 'center';
container.style.justifyContent = 'center';
container.style.height = '100vh';

document.body.style.fontFamily = 'Arial';


container.appendChild(p);
container.appendChild(but);
document.body.append(container);
