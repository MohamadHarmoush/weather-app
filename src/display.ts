import type { Weather, Forecast } from './models.js';

export function displayCurrentWeather(data: Weather): void {
    console.log('-------------------------***-----------------------------------');
    console.log(`current Date: ${formatWeatherTime(data.time)}`);
    console.log(`${data.icon} ${data.condition}`);
    console.log(`current temperature: ${data.temperature.value} ${data.temperature.unit}`);
    console.log(`current humidity: ${data.humidity}`);
    console.log(`current wind speed: ${data.windSpeed}`);
    console.log('-------------------------***----------------------------------');
}

export function displayForecasts(forecasts: Forecast[]): void {
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

export function formatWeatherTime(time: string, showHours: boolean = true): string {
    const currentDate = new Date(time);
    const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        weekday: 'long',
        day: 'numeric',
        year: 'numeric',
        ...(showHours ? { hour: '2-digit', minute: '2-digit' } : {}),
    };
    return currentDate.toLocaleDateString('en-US', options);
}
