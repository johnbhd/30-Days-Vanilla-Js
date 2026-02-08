import weatherApi from "./lib.js";
import { getWeatherData, getWeekData } from "./weather.js";
import {inputValidation}  from "./view.js";

const inputText = document.getElementById("inputText");
const btn = document.getElementById("btn");
const showDiv = document.querySelector(".show-result");
const weekDiv = document.querySelector(".week-result");

btn.addEventListener("click", () => {
  const inputValue = inputText.value.toLowerCase();
  console.log(inputValue);
  
  const { baseUrl, apiForecast } = weatherApi(inputValue);
  
  getWeatherData(baseUrl);
  getWeekData(apiForecast);
  
  console.log(apiForecast);
  
  showDiv.style.display = "flex";
})

inputText.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault()
    btn.click()
  }
})


