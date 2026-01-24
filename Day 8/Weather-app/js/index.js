import weatherApi from "./lib.js";

const inputText = document.getElementById("inputText");
const btn = document.getElementById("btn");
const showDiv = document.querySelector(".show-result");

async function getWeatherData(baseUrl) {
  try {
    const res = await fetch(baseUrl);
    
    if (!res.ok) {
      throw new Error("Respone status: " + res.status);
    }
    const data = await res.json();
    showResult(data);
    console.log(data);
  } catch (error) {
    console.error("Error fetching weather data", error);
  }
}

function showResult(data) {
  const temp = data.main.temp || 0;
  const clouds = data.weather[0].description || "normal clouds";
  showDiv.innerHTML = `
    <p>${temp}<sup>o</sup>C</p>
    <p>${clouds}</p>
  `;
  
}

btn.addEventListener("click", () => {
  const inputValue = inputText.value.toLowerCase();
  console.log(inputValue);
  
  const { baseUrl, api } = weatherApi(inputValue);
  getWeatherData(baseUrl);
  console.log(baseUrl);
  
  showDiv.style.display = "flex";
})
