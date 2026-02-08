const mainDiv = document.querySelector(".main-result");

export function showResult(data) {
  const temp = data.main.temp || 0;
  const clouds = data.weather[0].description || "normal clouds";
  mainDiv.innerHTML = `
    <h4 id="city">${data?.name}<sup>${data?.sys?.country}</sup></h4>
    <div class="temp">
      <p>${clouds}</p>
      <p>${temp}<sup>o</sup>C</p>
    </div>
  `;
  
}


export function inputValidation(message) {
  const p = document.createElement("p");

  p.textContent = message
  mainDiv.append(p)
  
}
