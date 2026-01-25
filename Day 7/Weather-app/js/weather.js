import showResult from "./view.js"

export default async function getWeatherData(baseUrl) {
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