import weatherApi from "./lib.js";
import getWeatherData from "./weather.js";

const inputText = document.getElementById("inputText");
const btn = document.getElementById("btn");
const showDiv = document.querySelector(".show-result");
const weekDiv = document.querySelector(".week-result");

btn.addEventListener("click", () => {
  const inputValue = inputText.value.toLowerCase();
  console.log(inputValue);
  
  const { baseUrl, apiWeekForecast } = weatherApi(inputValue);
  getWeatherData(baseUrl);
  console.log(apiWeekForecast);
  
  showDiv.style.display = "flex";
})
