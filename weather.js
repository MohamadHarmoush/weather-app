async function findCityLocation(name) {
    const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=1&format=json`;
    return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        // console.log(data)
        if (data.results === undefined || data.results.length == 0) throw Error('Error no results found!');
        const city = data.results[0];
        const location = {
            name : city.name,
            latitude: city.latitude,
            longitude: city.longitude, 
        };
        return location;
    })
    .catch(erorr => {
        console.error(erorr);
    })
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
    //console.log('apiUrl', apiUrl);
    
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

    const data = await response.json();
    //console.log(data)

    return data
}

function extractCommand(rawArgs) {
    const command  = {
        city: null,
        options: {
            forecast: null,
            celsius: false,
            save: false,
            favorites: false,
        },
    };
    let index = 0;
    while(index < rawArgs.length) {
        const arg = rawArgs[index];
        switch(arg) {
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
        throw new Error('Please provide a city name')
    }
    if (command.options.forecast === null) {
        command.options.forecast = 1
    }

    return command;
}

function displayCurrentWeather(data) {
    console.log(`current Date: ${formatWeatherTime(data)}`);
    console.log(`current temperature: ${data.current.temperature_2m} ${data.current_units.temperature_2m}`);
    console.log(`current humidity: ${data.current.relative_humidity_2m} ${data.current_units.relative_humidity_2m}`);
    console.log(`current wind speed: ${data.current.wind_speed_10m} ${data.current_units.wind_speed_10m}`);
}

function formatWeatherTime(data) {
    const isGMT = data.timezone === 'GMT';
    const currentDate = new Date(data.current.time + (isGMT ? 'Z' : ''));
    return currentDate.toLocaleDateString('en-US',  {
        month: 'long',
        weekday: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: "2-digit",
        second: '2-digit',
    });
}

function main() {
    const rawArgs = process.argv.slice(2);
    const cmd = extractCommand(rawArgs);
    // console.log('rawArgs:', rawArgs);
    console.log('command', cmd);
    
    findCityLocation(cmd.city)
    .then(data => {
        return fetchCurrentWeather(
            params = {
                celsius: cmd.options.celsius,
                forecast: cmd.options.forecast,
                latitude: data.latitude,
                longitude: data.longitude,
            }
        )
    })
    .then(data => {
        console.log('------------------------------------------------------------')
        displayCurrentWeather(data)
        console.log('------------------------------------------------------------')
    });
}

main();