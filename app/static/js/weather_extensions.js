/**
 * Weather Extensions for EcoSphere Platform
 * Handles additional weather data for Wind, Sky, Moon Phase cards
 * and additional features like "feels like" temperature and visibility
 */

// Function to calculate moon phase based on date
function getMoonPhase(date) {
    // Moon cycle is approximately 29.53 days
    const synodic = 29.53;
    
    // Convert date to Julian date
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Calculate approximate moon age in days
    let c = 0;
    let e = 0;
    let jd = 0;
    
    if (month < 3) {
        year--;
        month += 12;
    }
    
    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09;
    jd /= 29.53;
    
    // Get just the fractional part
    const phase = jd % 1;
    
    if (phase < 0) {
        phase += 1;
    }
    
    // Determine moon phase name based on age
    if (phase < 0.0625 || phase >= 0.9375) {
        return "New Moon";
    } else if (phase < 0.1875) {
        return "Waxing Crescent";
    } else if (phase < 0.3125) {
        return "First Quarter";
    } else if (phase < 0.4375) {
        return "Waxing Gibbous";
    } else if (phase < 0.5625) {
        return "Full Moon";
    } else if (phase < 0.6875) {
        return "Waning Gibbous";
    } else if (phase < 0.8125) {
        return "Last Quarter";
    } else {
        return "Waning Crescent";
    }
}

// Function to get wind direction from degrees
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Function to update the Wind card
function updateWindCard(windData) {
    const windValueElement = document.getElementById('wind-value');
    
    if (!windData || (windData.wind_speed === undefined && windData.wind_deg === undefined)) {
        windValueElement.innerHTML = 'No Data';
        return;
    }
    
    const speed = windData.wind_speed !== undefined ? windData.wind_speed : 0;
    const direction = windData.wind_deg !== undefined ? getWindDirection(windData.wind_deg) : 'N/A';
    const gust = windData.wind_gust !== undefined ? windData.wind_gust : null;
    
    let windText = `${speed} m/s ${direction}`;
    if (gust) {
        windText += ` (Gusts: ${gust} m/s)`;
    }
    
    windValueElement.innerHTML = windText;
}

// Function to update the Sky card
function updateSkyCard(weatherData) {
    const rainChanceElement = document.getElementById('rain-chance');
    const cloudCoverElement = document.getElementById('cloud-cover');
    
    // Update cloud cover
    if (weatherData && weatherData.cloud_cover !== undefined) {
        cloudCoverElement.textContent = `${weatherData.cloud_cover}%`;
    } else {
        cloudCoverElement.textContent = 'N/A';
    }
    
    // Update rain chance/amount
    if (weatherData && weatherData.rain_1h !== undefined) {
        // If we have actual rain amount, show it
        rainChanceElement.textContent = `${weatherData.rain_1h} mm`;
    } else {
        // Otherwise show N/A
        rainChanceElement.textContent = 'N/A';
    }
}

// Function to update the Moon Phase card
function updateMoonPhaseCard() {
    const moonPhaseElement = document.getElementById('moon-phase');
    const today = new Date();
    const phase = getMoonPhase(today);
    moonPhaseElement.textContent = phase;
}

// Function to update the Feels Like temperature
function updateFeelsLikeTemperature(weatherData) {
    const feelsLikeElement = document.getElementById('feelslike-value');
    
    if (weatherData && weatherData.feels_like !== undefined) {
        feelsLikeElement.textContent = `${weatherData.feels_like}°C`;
    } else {
        feelsLikeElement.textContent = 'N/A';
    }
}

// Function to update the Visibility
function updateVisibility(weatherData) {
    const visibilityElement = document.getElementById('visibility-value');
    
    if (weatherData && weatherData.visibility !== undefined) {
        // Convert visibility from meters to kilometers
        const visibilityKm = (weatherData.visibility / 1000).toFixed(1);
        visibilityElement.textContent = ` / Visibility ${visibilityKm} km`;
    } else {
        visibilityElement.textContent = ' / Visibility N/A';
    }
}

// Function to update all new weather cards
function updateExtendedWeatherCards(weatherData) {
    // Update Wind card
    updateWindCard(weatherData);
    
    // Update Sky card
    updateSkyCard(weatherData);
    
    // Update Moon Phase card
    updateMoonPhaseCard();
    
    // Update Feels Like temperature
    updateFeelsLikeTemperature(weatherData);
    
    // Update Visibility
    updateVisibility(weatherData);
}

// Export functions for use in dashboard.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateExtendedWeatherCards,
        getMoonPhase,
        getWindDirection
    };
}