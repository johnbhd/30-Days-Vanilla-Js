import weatherApi from "./lib.js";

const { baseUrl, api } = weatherApi("manila")

const inputText = document.getElementById("inputText");
const btn = document.getElementById("btn");

console.log(api);

btn.addEventListener("click", () => {
  alert(inputText.value)
})
