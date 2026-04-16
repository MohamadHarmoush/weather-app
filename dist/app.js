import { findCityLocation, fetchWeather } from './api.js';
import { saveItem, loadItem } from './localstorge.js';
// ============================================================================
// DOM Elements
// ============================================================================
const dom = {
    searchInput: getElement('search-input'),
    tempUnit: getElement('temp-unit'),
    forecastDays: getElement('forecast-days'),
    searchBtn: getElement('search-btn'),
    saveBtn: getElement('save-btn'),
    error: getElement('error-message'),
    loading: getElement('loading'),
    cityDataContainer: document.querySelector('.city-data-container'),
    favoritesSection: getElement('favorites-section'),
    weather: {
        city: getElement('weather-city-name'),
        time: getElement('weather-time'),
        condition: getElement('weather-condition-value'),
        icon: getElement('weather-condition-icon'),
        temp: getElement('weather-temp'),
        humidity: getElement('weather-humidity'),
        windSpeed: getElement('weather-wind-speed'),
    },
    forecast: document.querySelector('.forecast-scroll-container'),
    favorites: getElement('favorites-container'),
};
function getElement(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Element #${id} not found`);
    return el;
}
// ============================================================================
// State
// ============================================================================
const state = { city: null };
const FAVORITES_KEY = 'weather-app-favorites';
// ============================================================================
// UI Helpers
// ============================================================================
const ui = {
    setCityDataVisible(visible) {
        dom.cityDataContainer.classList.toggle('hidden', !visible);
    },
    showError(message) {
        dom.error.textContent = message;
        dom.error.classList.remove('hidden');
        this.hideLoading();
        this.setCityDataVisible(false);
    },
    hideError() {
        dom.error.classList.add('hidden');
    },
    showLoading(message = 'Loading...') {
        dom.loading.textContent = message;
        dom.loading.classList.remove('hidden');
        this.setCityDataVisible(false);
    },
    hideLoading() {
        dom.loading.classList.add('hidden');
    },
    buttonFeedback(btn, text, duration = 1500) {
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
function formatDate(time) {
    return new Date(time).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}
// ============================================================================
// Display Functions
// ============================================================================
function displayCurrentWeather(weather, cityName) {
    dom.weather.city.textContent = cityName;
    dom.weather.time.textContent = formatDate(weather.time);
    dom.weather.condition.textContent = weather.condition;
    dom.weather.icon.textContent = weather.icon;
    dom.weather.temp.textContent = `${weather.temperature.value} ${weather.temperature.unit}`;
    dom.weather.humidity.textContent = weather.humidity;
    dom.weather.windSpeed.textContent = weather.windSpeed;
}
function createForecastItem(f) {
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
function displayForecasts(forecasts) {
    dom.forecast.innerHTML = forecasts.map(createForecastItem).join('');
}
function createFavoriteItem(city) {
    return `
        <div class="favorite-item">
            <span class="favorite-name">${city.name}</span>
            <button class="btn btn-small load-fav-btn" data-city="${city.name}">Load</button>
            <button class="btn btn-small btn-danger remove-fav-btn" data-city="${city.name}">×</button>
        </div>
    `;
}
function renderFavorites() {
    const favorites = loadItem(FAVORITES_KEY, []) ?? [];
    if (favorites.length === 0) {
        dom.favoritesSection.classList.add('hidden');
        return;
    }
    dom.favoritesSection.classList.remove('hidden');
    dom.favorites.innerHTML = favorites.map(createFavoriteItem).join('');
    dom.favorites.querySelectorAll('.load-fav-btn').forEach((btn) => {
        btn.addEventListener('click', () => loadFavorite(btn.dataset.city));
    });
    dom.favorites.querySelectorAll('.remove-fav-btn').forEach((btn) => {
        btn.addEventListener('click', () => removeFavorite(btn.dataset.city));
    });
}
function loadFavorite(cityName) {
    if (!cityName)
        return;
    dom.searchInput.value = cityName;
    handleSearch();
}
function removeFavorite(cityName) {
    if (!cityName)
        return;
    const favorites = (loadItem(FAVORITES_KEY, []) ?? []).filter((city) => city.name.toLowerCase() !== cityName.toLowerCase());
    saveItem(FAVORITES_KEY, favorites);
    renderFavorites();
}
// ============================================================================
// Event Handlers
// ============================================================================
async function handleSearch() {
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
    }
    catch (error) {
        ui.showError(error instanceof Error ? error.message : 'Failed to fetch weather data');
    }
    finally {
        ui.hideLoading();
    }
}
function handleSave() {
    if (!state.city) {
        ui.showError('No city to save. Please search for a city first.');
        return;
    }
    const favorites = loadItem(FAVORITES_KEY, []) ?? [];
    const idx = favorites.findIndex((city) => city.name.toLowerCase() === state.city.name.toLowerCase());
    idx >= 0 ? (favorites[idx] = state.city) : favorites.push(state.city);
    saveItem(FAVORITES_KEY, favorites);
    renderFavorites();
    ui.buttonFeedback(dom.saveBtn, 'Saved!');
}
function handleOptionChange() {
    if (state.city) {
        handleSearch();
    }
}
// ============================================================================
// Initialization
// ============================================================================
function init() {
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
//# sourceMappingURL=app.js.map