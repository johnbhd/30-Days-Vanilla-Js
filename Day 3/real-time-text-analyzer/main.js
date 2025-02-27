import { TextArea } from "./TextArea.js";
import { Style } from "./style.js";

const {title, textInput, Rtitle, paraCount, sentCount, wordCount, charCount, numCount, speCount} = TextArea();

const container = document.createElement('div');
const resultDiv = document.createElement('div');

container.appendChild(title);
container.appendChild(textInput);

resultDiv.appendChild(Rtitle);
resultDiv.appendChild(paraCount);
resultDiv.appendChild(sentCount);
resultDiv.appendChild(wordCount);
resultDiv.appendChild(charCount);
resultDiv.appendChild(numCount);
resultDiv.appendChild(speCount);

document.body.append(container);
document.body.append(resultDiv);
Style(title, textInput, Rtitle, container, resultDiv, paraCount, sentCount, wordCount, charCount, numCount, speCount);