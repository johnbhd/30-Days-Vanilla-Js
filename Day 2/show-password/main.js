import { Input } from "./input.js";
import { Style } from "./style.js";

const {title, inputs, but, submit} = Input();
const container = document.createElement('div');

const br = document.createElement('br');

container.appendChild(title);
container.appendChild(inputs);
container.appendChild(but);
container.appendChild(br);
container.appendChild(submit);

document.body.append(container);

Style(title, inputs, but, submit);