"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayCurrentWeather = displayCurrentWeather;
exports.displayForecasts = displayForecasts;
exports.formatWeatherTime = formatWeatherTime;
function displayCurrentWeather(data) {
    console.log('-------------------------***-----------------------------------');
    console.log(`current Date: ${formatWeatherTime(data.time)}`);
    console.log(`${data.icon} ${data.condition}`);
    console.log(`current temperature: ${data.temperature.value} ${data.temperature.unit}`);
    console.log(`current humidity: ${data.humidity}`);
    console.log(`current wind speed: ${data.windSpeed}`);
    console.log('-------------------------***----------------------------------');
}
function displayForecasts(forecasts) {
    console.log('-----------------------***-------------------------------------');
    for (const forecast of forecasts) {
        console.log(`Weather in: ${formatWeatherTime(forecast.time, false)}`);
        console.log(`${forecast.icon} ${forecast.condition}`);
        const minTemperature = `${forecast.minTemperature.value} ${forecast.minTemperature.unit}`;
        const maxTemperature = `${forecast.maxTemperature.value} ${forecast.maxTemperature.unit}`;
        console.log(`temperature min: ${minTemperature}, max: ${maxTemperature}`);
        console.log(`wind speed: ${forecast.windSpeed}`);
        console.log('---------------------**---------------------------------------');
    }
}
function formatWeatherTime(time, showHours = true) {
    const currentDate = new Date(time);
    const options = {
        month: 'long',
        weekday: 'long',
        day: 'numeric',
        year: 'numeric',
        ...(showHours ? { hour: '2-digit', minute: '2-digit' } : {}),
    };
    return currentDate.toLocaleDateString('en-US', options);
}
//# sourceMappingURL=display.js.map