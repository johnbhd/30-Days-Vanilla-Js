import { showResult, inputValidation } from "./view.js"

export async function getWeatherData(baseUrl) {
  try {
    const res = await fetch(baseUrl);
    
    if (!res.ok) {
      throw new Error("Respone status: " + res.status);
    }
    const data = await res.json();
    console.log(data)
    showResult(data);
  } catch (error) {
    console.error("Error fetching weather data", error);
    inputValidation("No city weather found...")
  }
}

export async function getWeekData(apiWeekForecast) {
  try {
    const res = await fetch(apiWeekForecast);
    
    if (!res.ok) {
      throw new Error("Respone status: ", res.status);
    }
    
    const data = await res.json();
    console.log(data);
  } catch (error) {
    console.error("Error fetching week data weather", error);
  }
}