function createTemperature(value, unit) {
    return {
        value: value,
        unit: unit,
    };
}

function createForecast(time, minTemperature, maxTemperature, windSpeed) {
    return {
        time: time,
        minTemperature: minTemperature,
        maxTemperature: maxTemperature,
        windSpeed: windSpeed,
    };
}

function createWeather(time, temperature, windSpeed, humidity) {
    return {
        time: time,
        temperature: temperature,
        windSpeed: windSpeed,
        humidity: humidity,
    };
}

function createCity(name, location, weather, forecasts) {
    return {
        name: name,
        location: location,
        currentWeather: weather,
        forecasts: forecasts,
    };
}

function createForecastFromAPI(index, daily, units, isGMT) {
    return createForecast(
        daily.time[index] + (isGMT ? 'Z' : ''),
        createTemperature(daily.temperature_2m_min[index], units.temperature_2m_min),
        createTemperature(daily.temperature_2m_max[index], units.temperature_2m_max),
        `${daily.wind_speed_10m_max[index]} ${units.wind_speed_10m_max}`
    );
}

function createWeatherFromAPI(currentWeather, units, timezone) {
    const isGMT = timezone === 'GMT';
    const time = currentWeather.time + (isGMT ? 'Z' : '');
    const temperature = createTemperature(currentWeather.temperature_2m, units.temperature_2m);
    const humidity = `${currentWeather.relative_humidity_2m} ${units.relative_humidity_2m}`;
    const windSpeed = `${currentWeather.wind_speed_10m} ${units.wind_speed_10m}`;
    return createWeather(time, temperature, windSpeed, humidity);
}

module.exports = {
    createForecastFromAPI,
    createWeatherFromAPI,
    createCity,
};
