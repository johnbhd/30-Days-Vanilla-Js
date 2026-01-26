export default function weatherApi(city) {
    const apiKey = '4eb3703790b356562054106543b748b2';
    const units = "metric";
    let baseUrl = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + "&appid=" + apiKey + "&units=" + units;
    let apiForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;
    // let apiWeekForecast = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${api}`;
    
  return { baseUrl, apiForecast};
}