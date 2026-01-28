const mainDiv = document.querySelector(".main-result");

export default function showResult(data) {
  const temp = data.main.temp || 0;
  const clouds = data.weather[0].description || "normal clouds";
  mainDiv.innerHTML = `
    <p>${data?.name} <sup>${data?.sys?.country}</sup></p>
    <p>${temp}<sup>o</sup>C</p>
    <p>${clouds}</p>
  `;
  
}