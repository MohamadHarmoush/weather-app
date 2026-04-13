export interface Temperature {
    value: number;
    unit: string;
}

export interface Forecast {
    time: string;
    minTemperature: Temperature;
    maxTemperature: Temperature;
    windSpeed: string;
}

export interface Weather {
    time: string;
    temperature: Temperature;
    humidity: string;
    windSpeed: string;
}

export interface Location {
    latitude: number;
    longitude: number;
}

export interface City {
    name: string;
    location: Location;
    weatherData: WeatherData;
}

export interface WeatherData {
    current: Weather | null;
    forecasts: Forecast[];
}

export interface Command {
    cityName: string | null;
    options: {
        forecast: number;
        celsius: boolean;
        save: boolean;
        favorites: boolean;
    };
}
