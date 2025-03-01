import { TextArea } from "./TextArea.js";
import { Style } from "./style.js";

const {title, textInput, Rtitle, paraCount, sentCount, wordCount, charCount, numCount, speCount, button, resetbut} = TextArea();

const container = document.createElement('div');
const resultDiv = document.createElement('div');
const butDiv = document.createElement('div');

container.appendChild(title);
container.appendChild(textInput);
butDiv.appendChild(button);
butDiv.appendChild(resetbut);

resultDiv.appendChild(Rtitle);
resultDiv.appendChild(paraCount);
resultDiv.appendChild(sentCount);
resultDiv.appendChild(wordCount);
resultDiv.appendChild(charCount);
resultDiv.appendChild(numCount);
resultDiv.appendChild(speCount);

document.body.append(container);
document.body.append(butDiv);
document.body.append(resultDiv);
Style(title, textInput, Rtitle, container, resultDiv, paraCount, sentCount, wordCount, charCount, numCount, speCount, button, resetbut, butDiv);