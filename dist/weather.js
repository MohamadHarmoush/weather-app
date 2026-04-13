"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const display_js_1 = require("./display.js");
const api_js_1 = require("./api.js");
const FAVORITES_FILE = path_1.default.join(__dirname, 'favorites.json');
function loadFavorites() {
    if (!fs_1.default.existsSync(FAVORITES_FILE))
        return [];
    try {
        return JSON.parse(fs_1.default.readFileSync(FAVORITES_FILE, 'utf-8'));
    }
    catch {
        return [];
    }
}
function addFavorite(city) {
    const favorites = loadFavorites();
    const index = favorites.findIndex((fav) => fav.name.toLowerCase() === city.name.toLowerCase());
    if (index >= 0)
        favorites[index] = city;
    else
        favorites.push(city);
    saveFavorites(favorites);
}
function saveFavorites(favorites) {
    fs_1.default.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
}
function extractCommand(rawArgs) {
    const command = {
        cityName: null,
        options: {
            forecast: 1,
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
            case '-f': {
                const nextArg = rawArgs[++index];
                if (nextArg === undefined) {
                    throw new Error(`Flag ${arg} requires an integer value between 1 and 16.`);
                }
                const days = parseInt(nextArg);
                if (isNaN(days) || days < 1 || days > 16) {
                    throw new Error(`Flag ${arg} requires an integer value between 1 and 16.`);
                }
                command.options.forecast = days;
                break;
            }
            case '--celsius':
            case '-C':
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
            case '--save':
            case '-s':
                command.options.save = true;
                break;
            default:
                if (arg.startsWith('--'))
                    throw new Error(`Unknown flag: ${arg}`);
                command.cityName = arg.toLowerCase();
        }
        index++;
    }
    if (!command.cityName && !command.options.favorites) {
        throw new Error('Please provide a city name');
    }
    return command;
}
async function main() {
    const rawArgs = process.argv.slice(2);
    const cmd = extractCommand(rawArgs);
    console.log('command', cmd);
    if (cmd.options.favorites) {
        const favorites = loadFavorites();
        console.log('--------------------------------------------------------------');
        console.log('---------------------favorites--------------------------------');
        console.log('--------------------------------------------------------------');
        console.dir(favorites, { depth: null, colors: true });
        console.log('--------------------------------------------------------------');
        return;
    }
    const location = await (0, api_js_1.findCityLocation)(cmd.cityName);
    const weatherData = await (0, api_js_1.fetchWeather)(location, cmd.options.forecast, cmd.options.celsius);
    if (weatherData.forecasts.length > 0) {
        (0, display_js_1.displayForecasts)(weatherData.forecasts);
    }
    if (weatherData.current) {
        (0, display_js_1.displayCurrentWeather)(weatherData.current);
    }
    const city = {
        name: cmd.cityName ?? '',
        location: location,
        weatherData: weatherData,
    };
    if (cmd.options.save)
        addFavorite(city);
    console.log();
    console.log('---------------------Start-CityInformation--------------------------------');
    console.dir(city, { depth: null, colors: true });
    console.log('---------------------End-CityInformation----------------------------------');
}
main();
//# sourceMappingURL=weather.js.map