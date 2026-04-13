import type { Forecast, Location, Weather, WeatherData } from './models.js';

interface WeatherResponse {
    timezone: string;
    current?: {
        time: string;
        temperature_2m: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
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
    };
    daily_units?: {
        temperature_2m_max: string;
        temperature_2m_min: string;
        wind_speed_10m_max: string;
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
        current: ['relative_humidity_2m', 'wind_speed_10m', 'temperature_2m'].join(','),
        daily: ['temperature_2m_max', 'temperature_2m_min', 'wind_speed_10m_max'].join(','),
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
    return {
        time: response.current.time + (isGMT ? 'Z' : ''),
        temperature: {
            value: response.current.temperature_2m,
            unit: response.current_units.temperature_2m,
        },
        humidity: `${response.current.relative_humidity_2m} ${response.current_units.relative_humidity_2m}`,
        windSpeed: `${response.current.wind_speed_10m} ${response.current.wind_speed_10m}`,
    };
}

function parseForecastsResponse(response: WeatherResponse): Forecast[] {
    if (!response.daily || !response.daily_units) return [];

    const forecasts: Forecast[] = [];
    const isGMT = response.timezone === 'GMT';
    for (let i = 0; i < response.daily.time.length; i++) {
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
        });
    }
    return forecasts;
}
