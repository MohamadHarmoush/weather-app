import type { Forecast, Location, Weather, WeatherData } from './models.js';

interface WeatherResponse {
    timezone: string;
    current?: {
        time: string;
        temperature_2m: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        weather_code: number;
        is_day: number;
    };
    current_units?: {
        time: string;
        temperature_2m: string;
        relative_humidity_2m: string;
        wind_speed_10m: string;
    };
    daily?: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        wind_speed_10m_max: number[];
        weather_code: number[];
    };
    daily_units?: {
        temperature_2m_max: string;
        temperature_2m_min: string;
        wind_speed_10m_max: string;
    };
}

// WMO Weather interpretation codes (https://open-meteo.com/en/docs)
const WEATHER_CODES: Record<number, { condition: string; icon: string; iconNight?: string }> = {
    0: { condition: 'Clear sky', icon: '☀️', iconNight: '🌙' },
    1: { condition: 'Mainly clear', icon: '🌤️', iconNight: '🌙' },
    2: { condition: 'Partly cloudy', icon: '⛅', iconNight: '☁️' },
    3: { condition: 'Overcast', icon: '☁️' },
    45: { condition: 'Fog', icon: '🌫️' },
    48: { condition: 'Depositing rime fog', icon: '🌫️' },
    51: { condition: 'Light drizzle', icon: '🌦️' },
    53: { condition: 'Moderate drizzle', icon: '🌦️' },
    55: { condition: 'Dense drizzle', icon: '🌧️' },
    56: { condition: 'Light freezing drizzle', icon: '🌨️' },
    57: { condition: 'Dense freezing drizzle', icon: '🌨️' },
    61: { condition: 'Slight rain', icon: '🌦️' },
    63: { condition: 'Moderate rain', icon: '🌧️' },
    65: { condition: 'Heavy rain', icon: '🌧️' },
    66: { condition: 'Light freezing rain', icon: '🌨️' },
    67: { condition: 'Heavy freezing rain', icon: '🌨️' },
    71: { condition: 'Slight snow', icon: '🌨️' },
    73: { condition: 'Moderate snow', icon: '❄️' },
    75: { condition: 'Heavy snow', icon: '❄️' },
    77: { condition: 'Snow grains', icon: '🌨️' },
    80: { condition: 'Slight rain showers', icon: '🌦️' },
    81: { condition: 'Moderate rain showers', icon: '🌧️' },
    82: { condition: 'Violent rain showers', icon: '⛈️' },
    85: { condition: 'Slight snow showers', icon: '🌨️' },
    86: { condition: 'Heavy snow showers', icon: '❄️' },
    95: { condition: 'Thunderstorm', icon: '⛈️' },
    96: { condition: 'Thunderstorm with hail', icon: '⛈️' },
    99: { condition: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

export function getWeatherInfo(code: number, isDay: boolean = true): { condition: string; icon: string } {
    const info = WEATHER_CODES[code] || { condition: 'Unknown', icon: '❓' };
    return {
        condition: info.condition,
        icon: !isDay && info.iconNight ? info.iconNight : info.icon,
    };
}

export async function findCityLocation(name: string): Promise<Location> {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);
    const data = await res.json();
    const location = data.results?.[0];
    if (!location) throw new Error('City not found');
    return { latitude: location.latitude, longitude: location.longitude };
}

export async function fetchWeather(
    location: Location,
    days: number,
    celsius: boolean
): Promise<WeatherData> {
    const params = {
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        temperature_unit: celsius ? 'celsius' : 'fahrenheit',
        forecast_days: String(days),
        current: ['relative_humidity_2m', 'wind_speed_10m', 'temperature_2m', 'weather_code', 'is_day'].join(','),
        daily: ['temperature_2m_max', 'temperature_2m_min', 'wind_speed_10m_max', 'weather_code'].join(','),
    };
    const queryParams = new URLSearchParams(params);
    const apiUrl = `https://api.open-meteo.com/v1/forecast?${queryParams}`;
    console.log('apiUrl', apiUrl);

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

    const data: WeatherResponse = await response.json();
    return parseWeatherDataResponse(data);
}

function parseWeatherDataResponse(response: WeatherResponse): WeatherData {
    if (!response.current || !response.current_units) {
        throw new Error('Missing weather data');
    }

    return {
        current: parseWeatherResponse(response),
        forecasts: parseForecastsResponse(response),
    };
}

function parseWeatherResponse(response: WeatherResponse): Weather | null {
    if (!response.current || !response.current_units) return null;

    const isGMT = response.timezone === undefined || response.timezone === 'GMT';
    const isDay = response.current.is_day === 1;
    const weatherInfo = getWeatherInfo(response.current.weather_code, isDay);

    return {
        time: response.current.time + (isGMT ? 'Z' : ''),
        temperature: {
            value: response.current.temperature_2m,
            unit: response.current_units.temperature_2m,
        },
        humidity: `${response.current.relative_humidity_2m} ${response.current_units.relative_humidity_2m}`,
        windSpeed: `${response.current.wind_speed_10m} ${response.current_units.wind_speed_10m}`,
        condition: weatherInfo.condition,
        icon: weatherInfo.icon,
    };
}

function parseForecastsResponse(response: WeatherResponse): Forecast[] {
    if (!response.daily || !response.daily_units) return [];

    const forecasts: Forecast[] = [];
    const isGMT = response.timezone === 'GMT';
    for (let i = 0; i < response.daily.time.length; i++) {
        const weatherCode = response.daily.weather_code[i] ?? 0;
        const weatherInfo = getWeatherInfo(weatherCode, true);
        forecasts.push({
            time: response.daily.time[i] + (isGMT ? 'Z' : ''),
            minTemperature: {
                value: response.daily.temperature_2m_min[i]!,
                unit: response.daily_units.temperature_2m_min,
            },
            maxTemperature: {
                value: response.daily.temperature_2m_max[i]!,
                unit: response.daily_units.temperature_2m_max,
            },
            windSpeed: `${response.daily.wind_speed_10m_max[i]} ${response.daily_units.wind_speed_10m_max}`,
            condition: weatherInfo.condition,
            icon: weatherInfo.icon,
        });
    }
    return forecasts;
}
