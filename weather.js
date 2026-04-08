const { createForecastFromAPI, createWeatherFromAPI, createCity } = require('./models');

async function findCityLocation(name) {
    const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=1&format=json`;
    return fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            // console.log(data)
            if (data.results === undefined || data.results.length == 0)
                throw Error('Error no results found!');
            const city = data.results[0];
            const location = {
                latitude: city.latitude,
                longitude: city.longitude,
            };
            return location;
        })
        .catch((erorr) => {
            console.error(erorr);
        });
}

async function fetchCurrentWeather(params) {
    const queryParams = new URLSearchParams({
        latitude: params.latitude,
        longitude: params.longitude,
        temperature_unit: params.celsius ? 'celsius' : 'fahrenheit',
        forecast_days: parseInt(params.forecast) || 1,
        current: ['relative_humidity_2m', 'wind_speed_10m', 'temperature_2m'],
    });
    const apiUrl = `https://api.open-meteo.com/v1/forecast?${queryParams}`;
    console.log('apiUrl', apiUrl);

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

    const data = await response.json();
    return createWeatherFromAPI(data.current, data.current_units, data.timezone);
}

async function fetchForecast(params) {
    const apiUrl = new URL('https://api.open-meteo.com/v1/forecast?');
    apiUrl.searchParams.set('latitude', params.latitude);
    apiUrl.searchParams.set('longitude', params.longitude);
    apiUrl.searchParams.set('temperature_unit', params.celsius ? 'celsius' : 'fahrenheit');
    apiUrl.searchParams.set('forecast_days', params.forecast);
    apiUrl.searchParams.set('daily', [
        'temperature_2m_max',
        'temperature_2m_min',
        'wind_speed_10m_max',
    ]);

    const response = await fetch(apiUrl);
    console.log(apiUrl.toString());
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

    const data = await response.json();
    // displayForecastData(data, params.forecast);
    const forecasts = [];
    const isGMT = data.timezone === 'GMT';
    for (let index = 0; index < params.forecast; index++) {
        const forecast = createForecastFromAPI(index, data.daily, data.daily_units, isGMT);
        forecasts.push(forecast);
    }
    return forecasts;
}

function extractCommand(rawArgs) {
    const command = {
        city: null,
        options: {
            forecast: null,
            celsius: false,
            save: false,
            favorites: false,
        },
    };
    let index = 0;
    while (index < rawArgs.length) {
        const arg = rawArgs[index];
        switch (arg) {
            case '--forecast':
            case '-f':
                const days = parseInt(rawArgs[++index]);
                if (isNaN(days) || days < 0 || days > 16) {
                    throw new Error(`Flag ${arg} requires an integer value between 1 and 16.`);
                }
                command.options.forecast = days;
                break;
            case '--celsius':
            case '-c':
                command.options.celsius = true;
                break;
            case '--fahrenheit':
            case '-F':
                command.options.celsius = false;
                break;
            case '--favorites':
                command.options.favorites = true;
                break;
            default:
                if (arg.startsWith('--')) throw new Error(`Unknown flag: ${arg}`);
                command.city = arg.toLowerCase();
        }
        index++;
    }

    if (!command.city) {
        throw new Error('Please provide a city name');
    }
    if (command.options.forecast === null) {
        command.options.forecast = 1;
    }

    return command;
}

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

    for (let index = 0; index < forecasts.length; index++) {
        const forecast = forecasts[index];
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
    const options = showHours
        ? {
              month: 'long',
              weekday: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          }
        : {
              month: 'long',
              weekday: 'long',
              day: 'numeric',
              year: 'numeric',
          };
    return currentDate.toLocaleDateString('en-US', options);
}

async function main() {
    const rawArgs = process.argv.slice(2);
    const cmd = extractCommand(rawArgs);
    // console.log('rawArgs:', rawArgs);
    console.log('command', cmd);

    const location = await findCityLocation(cmd.city);
    const forecastDays = cmd.options.forecast;
    const weatherParams = {
        celsius: cmd.options.celsius,
        forecast: forecastDays,
        latitude: location.latitude,
        longitude: location.longitude,
    };
    let forecasts = [];
    let currentWeatherData = null;

    if (forecastDays > 1) {
        forecasts = await fetchForecast(weatherParams);
        displayForecasts(forecasts);
    } else {
        currentWeatherData = await fetchCurrentWeather(weatherParams);
        displayCurrentWeather(currentWeatherData);
    }
    console.log();
    const city = createCity(cmd.city, location, currentWeatherData, forecasts);
    console.log('---------------------Start-CityInformation--------------------------------');
    console.dir(city, { depth: null, colors: true });
    console.log('---------------------End-CityInformation----------------------------------');
}

main();
