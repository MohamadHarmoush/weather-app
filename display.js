function displayCurrentWeather(data) {
    console.log('-------------------------***-----------------------------------');
    console.log(`current Date: ${formatWeatherTime(data.time)}`);
    console.log(`current temperature: ${data.temperature.value} ${data.temperature.unit}`);
    console.log(`current humidity: ${data.humidity}`);
    console.log(`current wind speed: ${data.windSpeed}`);
    console.log('-------------------------***----------------------------------');
}

function displayForecastDataFromAPI(data, count) {
    console.log('------------------------------------------------------------');
    const daily = data.daily;
    const timezone = data.timezone;
    const dailyUnits = data.daily_units;
    const isGMT = timezone === 'GMT';
    for (let index = 0; index < count; index++) {
        const time = daily.time[index] + (isGMT ? 'Z' : '');
        console.log(`Weather in: ${formatWeatherTime(time, false)}`);
        const minTemperature = `${daily.temperature_2m_min[index]} ${dailyUnits.temperature_2m_min}`;
        const maxTemperature = `${daily.temperature_2m_max[index]} ${dailyUnits.temperature_2m_max}`;
        console.log(`current temperature min: ${minTemperature}, max: ${maxTemperature}`);
        console.log(
            `current wind speed: ${daily.wind_speed_10m_max[index]} ${dailyUnits.wind_speed_10m_max}`
        );
        console.log('------------------------------------------------------------');
    }
}

function displayForecasts(forecasts) {
    // console.log(forecasts);
    console.log('-----------------------***-------------------------------------');

    for (const forecast of forecasts) {
        console.log(`Weather in: ${formatWeatherTime(forecast.time, false)}`);

        const minTemperature = `${forecast.minTemperature.value} ${forecast.minTemperature.unit}`;
        const maxTemperature = `${forecast.maxTemperature.value} ${forecast.maxTemperature.unit}`;
        console.log(`temperature min: ${minTemperature}, max: ${maxTemperature}`);
        console.log(`wind speed: ${forecast.windSpeed}`);
        console.log('---------------------**---------------------------------------');
    }
}

function formatWeatherTime(time, timezone, showHours = true) {
    const isGMT = timezone === 'GMT';
    const currentDate = new Date(time + (isGMT ? 'Z' : ''));
    const options = {
        month: 'long',
        weekday: 'long',
        day: 'numeric',
        year: 'numeric',
        ...(showHours ? { hour: '2-digit', minute: '2-digit' } : {}),
    };
    return currentDate.toLocaleDateString('en-US', options);
}

module.exports = {
    displayCurrentWeather,
    displayForecasts,
};
