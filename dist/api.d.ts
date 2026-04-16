import type { Location, WeatherData } from './models.js';
export declare function getWeatherInfo(code: number, isDay?: boolean): {
    condition: string;
    icon: string;
};
export declare function findCityLocation(name: string): Promise<Location>;
export declare function fetchWeather(location: Location, days: number, celsius: boolean): Promise<WeatherData>;
//# sourceMappingURL=api.d.ts.map