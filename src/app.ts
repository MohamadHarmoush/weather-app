import { findCityLocation, fetchWeather } from './api.js';
import { saveItem, loadItem } from './localstorge.js';
import type { Weather, Forecast, City } from './models.js';

// ============================================================================
// DOM Elements
// ============================================================================
const dom = {
    searchInput: getElement<HTMLInputElement>('search-input'),
    tempUnit: getElement<HTMLSelectElement>('temp-unit'),
    forecastDays: getElement<HTMLSelectElement>('forecast-days'),
    searchBtn: getElement<HTMLButtonElement>('search-btn'),
    saveBtn: getElement<HTMLButtonElement>('save-btn'),
    error: getElement<HTMLDivElement>('error-message'),
    loading: getElement<HTMLDivElement>('loading'),
    cityDataContainer: document.querySelector('.city-data-container') as HTMLDivElement,
    favoritesSection: getElement<HTMLDivElement>('favorites-section'),
    weather: {
        city: getElement<HTMLDivElement>('weather-city-name'),
        time: getElement<HTMLDivElement>('weather-time'),
        condition: getElement<HTMLDivElement>('weather-condition-value'),
        icon: getElement<HTMLDivElement>('weather-condition-icon'),
        temp: getElement<HTMLDivElement>('weather-temp'),
        humidity: getElement<HTMLDivElement>('weather-humidity'),
        windSpeed: getElement<HTMLDivElement>('weather-wind-speed'),
    },
    forecast: document.querySelector('.forecast-scroll-container') as HTMLDivElement,
    favorites: getElement<HTMLDivElement>('favorites-container'),
};

function getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el as T;
}

// ============================================================================
// State
// ============================================================================
const state: { city: City | null } = { city: null };
const FAVORITES_KEY = 'weather-app-favorites';

// ============================================================================
// UI Helpers
// ============================================================================
const ui = {
    setCityDataVisible(visible: boolean): void {
        dom.cityDataContainer.classList.toggle('hidden', !visible);
    },

    showError(message: string): void {
        dom.error.textContent = message;
        dom.error.classList.remove('hidden');
        this.hideLoading();
        this.setCityDataVisible(false);
    },

    hideError(): void {
        dom.error.classList.add('hidden');
    },

    showLoading(message = 'Loading...'): void {
        dom.loading.textContent = message;
        dom.loading.classList.remove('hidden');
        this.setCityDataVisible(false);
    },

    hideLoading(): void {
        dom.loading.classList.add('hidden');
    },

    buttonFeedback(btn: HTMLButtonElement, text: string, duration = 1500): void {
        const original = btn.textContent;
        btn.textContent = text;
        setTimeout(() => {
            btn.textContent = original;
        }, duration);
    },
};

// ============================================================================
// Formatting
// ============================================================================
function formatDate(time: string): string {
    return new Date(time).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

// ============================================================================
// Display Functions
// ============================================================================
function displayCurrentWeather(weather: Weather, cityName: string): void {
    dom.weather.city.textContent = cityName;
    dom.weather.time.textContent = formatDate(weather.time);
    dom.weather.condition.textContent = weather.condition;
    dom.weather.icon.textContent = weather.icon;
    dom.weather.temp.textContent = `${weather.temperature.value} ${weather.temperature.unit}`;
    dom.weather.humidity.textContent = weather.humidity;
    dom.weather.windSpeed.textContent = weather.windSpeed;
}

function createForecastItem(f: Forecast): string {
    return `
        <div class="forecast-item">
            <div class="forecast-time">${formatDate(f.time)}</div>
            <div class="forecast-condition">
                <div class="forecast-condition-icon">${f.icon}</div>
                <div class="forecast-condition-value">${f.condition}</div>
            </div>
            <div class="forecast-detail-item">
                <div class="detail-label">min:</div>
                <div class="detail-value">${f.minTemperature.value}${f.minTemperature.unit}</div>
            </div>
            <div class="forecast-detail-item">
                <div class="detail-label">max:</div>
                <div class="detail-value">${f.maxTemperature.value}${f.maxTemperature.unit}</div>
            </div>
            <div class="forecast-detail-item">
                <div class="detail-label">wind Speed:</div>
                <div class="detail-value">${f.windSpeed}</div>
            </div>
        </div>
    `;
}

function displayForecasts(forecasts: Forecast[]): void {
    dom.forecast.innerHTML = forecasts.map(createForecastItem).join('');
}

function createFavoriteItem(city: City): string {
    return `
        <div class="favorite-item">
            <span class="favorite-name">${city.name}</span>
            <button class="btn btn-small load-fav-btn" data-city="${city.name}">Load</button>
            <button class="btn btn-small btn-danger remove-fav-btn" data-city="${city.name}">×</button>
        </div>
    `;
}

function renderFavorites(): void {
    const favorites = loadItem<City[]>(FAVORITES_KEY, []) ?? [];

    if (favorites.length === 0) {
        dom.favoritesSection.classList.add('hidden');
        return;
    }

    dom.favoritesSection.classList.remove('hidden');
    dom.favorites.innerHTML = favorites.map(createFavoriteItem).join('');

    dom.favorites.querySelectorAll('.load-fav-btn').forEach((btn) => {
        btn.addEventListener('click', () => loadFavorite((btn as HTMLButtonElement).dataset.city));
    });

    dom.favorites.querySelectorAll('.remove-fav-btn').forEach((btn) => {
        btn.addEventListener('click', () =>
            removeFavorite((btn as HTMLButtonElement).dataset.city)
        );
    });
}

function loadFavorite(cityName: string | undefined): void {
    if (!cityName) return;
    dom.searchInput.value = cityName;
    handleSearch();
}

function removeFavorite(cityName: string | undefined): void {
    if (!cityName) return;

    const favorites = (loadItem<City[]>(FAVORITES_KEY, []) ?? []).filter(
        (city) => city.name.toLowerCase() !== cityName.toLowerCase()
    );

    saveItem(FAVORITES_KEY, favorites);
    renderFavorites();
}

// ============================================================================
// Event Handlers
// ============================================================================
async function handleSearch(): Promise<void> {
    const name = dom.searchInput.value.trim();

    if (!name) {
        ui.showError('Please enter a city name');
        return;
    }

    ui.hideError();
    ui.showLoading();

    try {
        const location = await findCityLocation(name);
        const days = parseInt(dom.forecastDays.value, 10);
        const celsius = dom.tempUnit.value === 'celsius';
        const weatherData = await fetchWeather(location, days, celsius);

        state.city = { name, location, weatherData };

        if (weatherData.current) {
            displayCurrentWeather(weatherData.current, name);
        }

        displayForecasts(weatherData.forecasts);
        ui.setCityDataVisible(true);
    } catch (error) {
        ui.showError(error instanceof Error ? error.message : 'Failed to fetch weather data');
    } finally {
        ui.hideLoading();
    }
}

function handleSave(): void {
    if (!state.city) {
        ui.showError('No city to save. Please search for a city first.');
        return;
    }

    const favorites = loadItem<City[]>(FAVORITES_KEY, []) ?? [];
    const idx = favorites.findIndex(
        (city) => city.name.toLowerCase() === state.city!.name.toLowerCase()
    );
    idx >= 0 ? (favorites[idx] = state.city) : favorites.push(state.city);

    saveItem(FAVORITES_KEY, favorites);
    renderFavorites();
    ui.buttonFeedback(dom.saveBtn, 'Saved!');
}

function handleOptionChange(): void {
    if (state.city) {
        handleSearch();
    }
}

// ============================================================================
// Initialization
// ============================================================================
function init(): void {
    dom.searchBtn.addEventListener('click', handleSearch);
    dom.searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    dom.saveBtn.addEventListener('click', handleSave);
    dom.tempUnit.addEventListener('change', handleOptionChange);
    dom.forecastDays.addEventListener('change', handleOptionChange);

    renderFavorites();
    ui.setCityDataVisible(false);
}

init();
