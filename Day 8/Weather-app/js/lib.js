export default function weatherApi(city) {
    const apiKey = '4eb3703790b356562054106543b748b2';
    const units = "metric";
    let baseUrl = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + "&appid=" + apiKey + "&units=" + units;
    let api = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;
  return { baseUrl, api};
}