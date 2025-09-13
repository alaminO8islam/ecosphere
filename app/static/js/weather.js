// weather.js - Handles geolocation and weather data fetching

// Use weatherLocation instead of userLocation to avoid conflicts with vitamin.js
let weatherLocation = {
    latitude: null,
    longitude: null
};

// Default Weather API keys from temp/w.js as fallback
const defaultWeatherAPIKeys = [
    "469f9ee790b69666f3a5a88336719cd0", // Current project key
    "5c582294e0c3ad4ad8d5a1d3a51f1ef0",
    "58b6f7c78582bffab3936dac99c31b25",
    "95ddb6bd3590458b7d291b15bbd6895c",
    "2e63a77d7d8b4f61d8e5a3e1f0528d4f",
    "89f6528ad0624dbe9f362409251309",
    "605e6dad96c84826b3f62908251309"
];

// Request geolocation permission and set up auto-refresh when the page loads
document.addEventListener('DOMContentLoaded', () => {
    requestGeolocation();
    
    // Set up auto-refresh when the browser window regains focus
    window.addEventListener('focus', () => {
        console.log('Window focused - refreshing weather data');
        forceRefreshWeatherData();
    });
    
    // Set up auto-refresh when the page becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('Page visible - refreshing weather data');
            forceRefreshWeatherData();
        }
    });
});

// Check if we have cached weather data
const cachedWeatherData = localStorage.getItem('weatherData');
if (cachedWeatherData) {
    try {
        const weatherData = JSON.parse(cachedWeatherData);
        const cacheTime = localStorage.getItem('weatherDataTime');
        
        // Use cached data if it's less than 30 minutes old
        if (cacheTime && (Date.now() - parseInt(cacheTime)) < 30 * 60 * 1000) {
            updateDashboardCards(weatherData);
        } else {
            // Cache is too old, request new data
            requestGeolocation();
        }
    } catch (e) {
        console.error('Error parsing cached weather data:', e);
        requestGeolocation();
    }
} else {
    requestGeolocation();
}

// Function to request geolocation permission
function requestGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Store user's location
                weatherLocation.latitude = position.coords.latitude;
                weatherLocation.longitude = position.coords.longitude;
                
                // Fetch weather data
                fetchWeatherData();
                
                // Store location in session storage for other pages
                sessionStorage.setItem('userLatitude', weatherLocation.latitude);
                sessionStorage.setItem('userLongitude', weatherLocation.longitude);
                
                // Also store in localStorage for persistence
                localStorage.setItem('weatherLatitude', weatherLocation.latitude);
                localStorage.setItem('weatherLongitude', weatherLocation.longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                // Try IP-based location as fallback
                getLocationByIP();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser');
        // Try IP-based location as fallback
        getLocationByIP();
    }
}

// Function to get location by IP as fallback
function getLocationByIP() {
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            if (data.latitude && data.longitude) {
                weatherLocation.latitude = data.latitude;
                weatherLocation.longitude = data.longitude;
                
                // Store location
                sessionStorage.setItem('userLatitude', weatherLocation.latitude);
                sessionStorage.setItem('userLongitude', weatherLocation.longitude);
                localStorage.setItem('weatherLatitude', weatherLocation.latitude);
                localStorage.setItem('weatherLongitude', weatherLocation.longitude);
                
                // Fetch weather data
                fetchWeatherData();
            } else {
                displayGeolocationError();
            }
        })
        .catch(error => {
            console.error('IP location error:', error);
            displayGeolocationError();
        });
}

// Function to fetch weather data from the backend
function fetchWeatherData() {
    // First try our backend API
    fetch(`/dashboard/api/weather?lat=${weatherLocation.latitude}&lon=${weatherLocation.longitude}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Cache the weather data
            localStorage.setItem('weatherData', JSON.stringify(data));
            localStorage.setItem('weatherDataTime', Date.now().toString());
            
            // Log the data for debugging
            console.log('Weather data from backend:', data);
            
            // Update the dashboard
            updateDashboardCards(data);
            
            // Force refresh every 15 minutes
            setTimeout(fetchWeatherData, 15 * 60 * 1000);
        })
        .catch(error => {
            console.error('Error fetching weather data from backend:', error);
            // Try direct API call as fallback
            fetchWeatherDirectAPI();
        });
}

// Function to fetch weather data directly from WeatherAPI as fallback
function fetchWeatherDirectAPI() {
    // Get a working API key from our pool
    const apiKey = getWorkingAPIKey();
    
    // Fetch from WeatherAPI.com with air quality data
    fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${weatherLocation.latitude},${weatherLocation.longitude}&aqi=yes`)
        .then(response => {
            if (!response.ok) {
                // Mark this API key as failed
                markAPIKeyAsFailed(apiKey);
                throw new Error('Weather API response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update location information
            if (data.location) {
                updateLocationInfo(data.location.name, data.location.country);
            }
            
            // Transform the data to match our expected format
            const transformedData = {
                temperature: data.current.temp_c,
                feels_like: data.current.feelslike_c,
                humidity: data.current.humidity,
                uv_index: data.current.uv,
                weather_condition: data.current.condition.text,
                weather_description: data.current.condition.text,
                // Add wind data
                wind_speed: data.current.wind_kph / 3.6, // convert to m/s
                wind_deg: data.current.wind_degree,
                wind_gust: data.current.gust_kph / 3.6, // convert to m/s
                // Add cloud and rain data
                cloud_cover: data.current.cloud,
                rain_1h: data.current.precip_mm,
                // Add visibility
                visibility: data.current.vis_km,
                // Add air quality data
                air_quality: data.current.air_quality
            };
            
            // Cache the weather data
            localStorage.setItem('weatherData', JSON.stringify(transformedData));
            localStorage.setItem('weatherDataTime', Date.now().toString());
            
            // Update the dashboard
            updateDashboardCards(transformedData);
            
            // Force refresh every 15 minutes
            setTimeout(fetchWeatherData, 15 * 60 * 1000);
        })
        .catch(error => {
            console.error('Error fetching weather data from direct API:', error);
            // Try OpenWeather as last resort
            fetchOpenWeatherDirectAPI();
        });}

// Function to fetch from OpenWeather directly as last resort
function fetchOpenWeatherDirectAPI() {
    // Get a working API key from our new pool
    const apiKey = getWorkingAPIKey();
    
    // Fetch current weather data
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${weatherLocation.latitude}&lon=${weatherLocation.longitude}&appid=${apiKey}&units=metric`)
        .then(response => {
            if (!response.ok) {
                // Mark this API key as failed
                markAPIKeyAsFailed(apiKey);
                throw new Error('OpenWeather API response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Transform the data to match our expected format
            const transformedData = {
                temperature: data.main.temp,
                feels_like: data.main.feels_like,
                humidity: data.main.humidity,
                uv_index: 0, // UV index not available in this endpoint
                weather_condition: data.weather[0].main,
                weather_description: data.weather[0].description,
                // Add wind data
                wind_speed: data.wind.speed,
                wind_deg: data.wind.deg,
                wind_gust: data.wind.gust || data.wind.speed, // Use speed as fallback if gust not available
                // Add cloud and rain data
                cloud_cover: data.clouds ? data.clouds.all : 0,
                rain_1h: data.rain ? data.rain['1h'] : 0,
                // Add visibility (OpenWeather provides in meters)
                visibility: data.visibility / 1000, // Convert to km
                // Add air quality data (not available in this endpoint, but needed for the dashboard)
                air_quality: {
                    pm2_5: 0,
                    pm10: 0,
                    o3: 0,
                    no2: 0,
                    so2: 0,
                    co: 0
                }
            };
            
            // Cache the weather data
            localStorage.setItem('weatherData', JSON.stringify(transformedData));
            localStorage.setItem('weatherDataTime', Date.now().toString());
            
            // Update the dashboard
            updateDashboardCards(transformedData);
        })
        .catch(error => {
            console.error('Error fetching weather data from OpenWeather:', error);
            displayWeatherError();
        });
}

// Function to get wind direction from degrees
function getWindDirection(degrees) {
    if (degrees === undefined || degrees === null) return 'N/A';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Function to update wind data display
function updateWindDisplay(data) {
    const windElement = document.getElementById('wind-value');
    const windTrendElement = document.getElementById('wind-trend');
    
    if (windElement && data.wind_speed !== undefined) {
        const windSpeed = typeof data.wind_speed === 'number' ? data.wind_speed.toFixed(1) : data.wind_speed;
        const windDirection = getWindDirection(data.wind_deg);
        
        // Convert m/s to km/h for display
        const windSpeedKmh = (parseFloat(windSpeed) * 3.6).toFixed(1);
        
        windElement.textContent = `${windSpeedKmh} km/h ${windDirection}`;
        
        if (windTrendElement && data.wind_gust !== undefined) {
            const windGust = typeof data.wind_gust === 'number' ? data.wind_gust.toFixed(1) : data.wind_gust;
            const windGustKmh = (parseFloat(windGust) * 3.6).toFixed(1);
            windTrendElement.innerHTML = `<i class="fas fa-wind"></i> Gusts: ${windGustKmh} km/h`;
        }
    }
}

// Function to update air quality display
function updateAirQualityDisplay(data) {
    const airQualityElement = document.getElementById('air-quality-value');
    const airQualityTrendElement = document.getElementById('air-quality-trend');
    const airQualityDetailsElement = document.getElementById('air-quality-details');
    
    if (airQualityElement) {
        let airQualityStatus = 'Moderate';
        let airQualityIndex = 0;
        
        // Check if we have air quality data
        if (data.air_quality) {
            // Extract PM2.5 and PM10 values
            const pm25 = data.air_quality.pm2_5 || 0;
            const pm10 = data.air_quality.pm10 || 0;
            
            // Determine air quality status based on PM2.5 and PM10 values
            if (pm25 < 10 && pm10 < 20) {
                airQualityStatus = 'Good';
            } else if (pm25 < 25 && pm10 < 50) {
                airQualityStatus = 'Moderate';
            } else if (pm25 < 50 && pm10 < 100) {
                airQualityStatus = 'Poor';
            } else {
                airQualityStatus = 'Very Poor';
            }
            
            // Set air quality index (using PM2.5 as a proxy)
            airQualityIndex = pm25;
            
            // Update air quality details
            if (airQualityDetailsElement) {
                airQualityDetailsElement.innerHTML = `PM2.5: ${pm25.toFixed(1)} μg/m³, PM10: ${pm10.toFixed(1)} μg/m³`;
            }
        } else {
            // Default values if no air quality data is available
            if (airQualityDetailsElement) {
                airQualityDetailsElement.innerHTML = 'PM2.5: 15.0 μg/m³, PM10: 25.0 μg/m³';
            }
        }
        
        // Update air quality value
        airQualityElement.textContent = airQualityStatus;
        
        // Update air quality trend
        if (airQualityTrendElement) {
            airQualityTrendElement.innerHTML = `<i class="fas fa-check"></i> Current`;
        }
    }
}

// Function to calculate moon phase
function getMoonPhase() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Calculate the Julian date
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    // Calculate the moon phase
    const phase = (jd - 2451550.1) / 29.53;
    const normalizedPhase = phase - Math.floor(phase);
    
    // Determine the moon phase name and icon
    let moonPhase = '';
    let moonIcon = '';
    
    if (normalizedPhase < 0.025 || normalizedPhase > 0.975) {
        moonPhase = 'New Moon';
        moonIcon = 'fa-circle';
    } else if (normalizedPhase < 0.25) {
        moonPhase = 'Waxing Crescent';
        moonIcon = 'fa-moon';
    } else if (normalizedPhase < 0.275) {
        moonPhase = 'First Quarter';
        moonIcon = 'fa-adjust';
    } else if (normalizedPhase < 0.475) {
        moonPhase = 'Waxing Gibbous';
        moonIcon = 'fa-moon';
    } else if (normalizedPhase < 0.525) {
        moonPhase = 'Full Moon';
        moonIcon = 'fa-circle';
    } else if (normalizedPhase < 0.725) {
        moonPhase = 'Waning Gibbous';
        moonIcon = 'fa-moon';
    } else if (normalizedPhase < 0.775) {
        moonPhase = 'Last Quarter';
        moonIcon = 'fa-adjust';
    } else {
        moonPhase = 'Waning Crescent';
        moonIcon = 'fa-moon';
    }
    
    // Update the moon phase element
    const moonPhaseElement = document.getElementById('moon-phase');
    if (moonPhaseElement) {
        moonPhaseElement.textContent = moonPhase;
    }
    
    // Update the moon icon
    const moonIconElement = document.querySelector('.stat-card.moon .stat-icon i');
    if (moonIconElement) {
        // Remove all existing moon-related classes
        moonIconElement.className = '';
        // Add the appropriate icon class
        moonIconElement.classList.add('fas', moonIcon);
    }
    
    return moonPhase;
}

// Call getMoonPhase immediately when the script loads
document.addEventListener('DOMContentLoaded', function() {
    getMoonPhase();
});

// Function to get a working API key
// Track failed API keys to avoid reusing them in the same session
let failedAPIKeys = [];

function getWorkingAPIKey() {
    // Try to use our configured key first
    const configuredKey = '469f9ee790b69666f3a5a88336719cd0'; // From .env
    
    // If the configured key has failed, or we don't have one, use one from the default list
    if (failedAPIKeys.includes(configuredKey) || !configuredKey) {
        // Filter out keys that have failed
        const availableKeys = defaultWeatherAPIKeys.filter(key => !failedAPIKeys.includes(key));
        
        // If we have available keys, use one of them
        if (availableKeys.length > 0) {
            // Prioritize the newly added keys
            const newKeys = ['605e6dad96c84826b3f62908251309', '89f6528ad0624dbe9f362409251309'];
            const priorityKeys = newKeys.filter(key => availableKeys.includes(key));
            
            if (priorityKeys.length > 0) {
                // Use one of the new keys
                const randomIndex = Math.floor(Math.random() * priorityKeys.length);
                return priorityKeys[randomIndex];
            }
            
            // Otherwise use any available key
            const randomIndex = Math.floor(Math.random() * availableKeys.length);
            return availableKeys[randomIndex];
        }
        
        // If all keys have failed, reset the failed keys list and try again
        // This gives keys a second chance in case the failure was temporary
        if (failedAPIKeys.length >= defaultWeatherAPIKeys.length) {
            console.log('All API keys have failed, resetting and trying again');
            failedAPIKeys = [];
            return getWorkingAPIKey();
        }
    }
    
    return configuredKey;
}

// Function to mark an API key as failed
function markAPIKeyAsFailed(key) {
    if (!failedAPIKeys.includes(key)) {
        failedAPIKeys.push(key);
        console.log(`Marked API key as failed: ${key.substring(0, 5)}...`);
    }
}

// Function to update the current day and location in the header
function updateLocationInfo(city, country) {
    // Update the current day - FORCE UPDATE
    const currentDayElement = document.getElementById('current-day');
    if (currentDayElement) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const dayOfWeek = days[today.getDay()];
        const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        currentDayElement.textContent = `${dayOfWeek}, ${formattedDate}`;
    }
    
    // Update the location - FORCE UPDATE
    const locationElement = document.getElementById('current-location');
    if (locationElement) {
        if (city && country) {
            locationElement.textContent = `${city}, ${country}`;
        } else if (weatherLocation.latitude && weatherLocation.longitude) {
            // Initially show loading state
            locationElement.textContent = 'Loading location...';
            
            // Try to get city and country from reverse geocoding
            fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${weatherLocation.latitude}&lon=${weatherLocation.longitude}&limit=1&appid=${getWorkingAPIKey()}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.length > 0) {
                        const cityName = data[0].name;
                        const countryCode = data[0].country;
                        locationElement.textContent = `${cityName}, ${countryCode}`;
                    } else {
                        // Fallback to coordinates if no location data
                        locationElement.textContent = `${weatherLocation.latitude.toFixed(2)}°, ${weatherLocation.longitude.toFixed(2)}°`;
                    }
                })
                .catch(error => {
                    console.error('Error getting location name:', error);
                    // Fallback to coordinates on error
                    locationElement.textContent = `${weatherLocation.latitude.toFixed(2)}°, ${weatherLocation.longitude.toFixed(2)}°`;
                });
        } else {
            // Try to get cached location first
            const cachedLat = localStorage.getItem('weatherLatitude');
            const cachedLon = localStorage.getItem('weatherLongitude');
            
            if (cachedLat && cachedLon) {
                // Initially show loading state
                locationElement.textContent = 'Loading location...';
                
                // Try to get city and country from reverse geocoding
                fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${cachedLat}&lon=${cachedLon}&limit=1&appid=${getWorkingAPIKey()}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data && data.length > 0) {
                            const cityName = data[0].name;
                            const countryCode = data[0].country;
                            locationElement.textContent = `${cityName}, ${countryCode}`;
                        } else {
                            // Fallback to coordinates if no location data
                            locationElement.textContent = `${parseFloat(cachedLat).toFixed(2)}°, ${parseFloat(cachedLon).toFixed(2)}°`;
                        }
                    })
                    .catch(error => {
                        console.error('Error getting location name:', error);
                        // Fallback to coordinates on error
                        locationElement.textContent = `${parseFloat(cachedLat).toFixed(2)}°, ${parseFloat(cachedLon).toFixed(2)}°`;
                    });
            } else {
                locationElement.textContent = 'Location unavailable';
            }
        }
    }
}

// Add a refresh button event listener
document.addEventListener('DOMContentLoaded', function() {
    const refreshButton = document.getElementById('refresh-weather');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            // Force refresh weather data
            forceRefreshWeatherData();
        });
    }
});

// Function to force refresh weather data
function forceRefreshWeatherData() {
    console.log('Forcing weather data refresh');
    // Clear cached weather data
    localStorage.removeItem('weatherData');
    localStorage.removeItem('weatherDataTime');
    
    // Get fresh weather data
    if (weatherLocation.latitude && weatherLocation.longitude) {
        fetchWeatherData(weatherLocation.latitude, weatherLocation.longitude);
    } else {
        // Try to get location again
        requestGeolocation();
    }
}

// Function to update dashboard cards with weather data
function updateDashboardCards(data) {
    console.log('Updating dashboard with data:', data);
    // Update current day in header - FORCE UPDATE
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const dayOfWeek = days[today.getDay()];
    const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const currentDayElement = document.getElementById('current-day');
    if (currentDayElement) {
        currentDayElement.textContent = `${dayOfWeek}, ${formattedDate}`;
    }
    
    // Update wind display
    updateWindDisplay(data);
    
    // Update Air Quality display
    updateAirQualityDisplay(data);
    
    // Update Sky Card with rain and cloudiness data
    const rainChanceElement = document.getElementById('rain-chance');
    const cloudCoverElement = document.getElementById('cloud-cover');
    
    if (rainChanceElement) {
        // Format rain amount to one decimal place if it's a number
        const formattedRain = typeof data.rain_1h === 'number' ? data.rain_1h.toFixed(1) : (data.rain_1h || 0);
        rainChanceElement.textContent = `${formattedRain} mm`;
    }
    
    if (cloudCoverElement) {
        // Round cloudiness to nearest integer if it's a number
        const formattedCloud = typeof data.cloud_cover === 'number' ? Math.round(data.cloud_cover) : (data.cloud_cover || 0);
        cloudCoverElement.textContent = `${formattedCloud}%`;
    }
    
    // Update Moon Phase - FORCE UPDATE
    const moonPhaseElement = document.getElementById('moon-phase');
    if (moonPhaseElement) {
        // FORCE UPDATE
        if (data && data.astronomy && data.astronomy.astro && data.astronomy.astro.moon_phase) {
            moonPhaseElement.textContent = data.astronomy.astro.moon_phase;
        } else {
            const moonPhase = getMoonPhase();
            moonPhaseElement.textContent = moonPhase || 'Waxing Crescent';
        }
    }
    
    // FORCE UPDATE location regardless of current content
    const locationElement = document.getElementById('current-location');
    if (locationElement) {
        if (weatherLocation.latitude && weatherLocation.longitude) {
            locationElement.textContent = `${weatherLocation.latitude.toFixed(2)}°, ${weatherLocation.longitude.toFixed(2)}°`;
        } else {
            locationElement.textContent = 'Location unavailable';
        }
    }
    
    // Update Temperature
    const tempElement = document.getElementById('temperature-value');
    const tempTrendElement = document.getElementById('temperature-trend');
    const feelsLikeElement = document.getElementById('feelslike-value');
    if (tempElement && data.temperature !== undefined) {
        // Format temperature with one decimal place
        const formattedTemp = typeof data.temperature === 'number' ? data.temperature.toFixed(1) : data.temperature;
        
        // Check if feels_like data exists
        if (data.feels_like !== undefined) {
            // Format feels_like with one decimal place
            const formattedFeelsLike = typeof data.feels_like === 'number' ? data.feels_like.toFixed(1) : data.feels_like;
            // Update the display to match the screenshot format
            tempElement.innerHTML = `${formattedTemp}°C - Feels Like ${formattedFeelsLike}°C`;
        } else {
            tempElement.innerHTML = `${formattedTemp}°C`;
        }
        
        // Force update the DOM to ensure changes are applied
        tempElement.style.display = 'none';
        tempElement.offsetHeight; // Force a reflow
        tempElement.style.display = '';
        
        if (tempTrendElement) {
            tempTrendElement.innerHTML = `<i class="fas fa-check"></i> Current`;
            tempTrendElement.className = 'trend up';
        }
    }
    
    // Update Humidity
    const humidityElement = document.getElementById('humidity-value');
    const humidityTrendElement = document.getElementById('humidity-trend');
    if (humidityElement && data.humidity !== undefined) {
        // Format humidity as an integer
        const formattedHumidity = typeof data.humidity === 'number' ? Math.round(data.humidity) : data.humidity;
        humidityElement.innerHTML = `${formattedHumidity}% `;
        if (humidityTrendElement) {
            humidityTrendElement.innerHTML = `<i class="fas fa-check"></i> Current`;
            humidityTrendElement.className = 'trend up';
        }
    }
    
    // Update Light & Visibility card
    const lightElement = document.getElementById('light-value');
    const lightTrendElement = document.getElementById('light-trend');
    const visibilityElement = document.getElementById('visibility-value');
    
    if (lightElement && data.uv_index !== undefined) {
        let lightStatus = 'Low';
        if (data.uv_index >= 3 && data.uv_index < 6) {
            lightStatus = 'Moderate';
        } else if (data.uv_index >= 6 && data.uv_index < 8) {
            lightStatus = 'High';
        } else if (data.uv_index >= 8) {
            lightStatus = 'Very High';
        }
        
        lightElement.innerHTML = `${lightStatus} `;
        if (lightTrendElement) {
            lightTrendElement.innerHTML = `<i class="fas fa-check"></i> UV: ${typeof data.uv_index === 'number' ? data.uv_index.toFixed(1) : data.uv_index}`;
            lightTrendElement.className = 'trend up';
        }
        
        // Update visibility
        if (visibilityElement && data.visibility !== undefined) {
            const formattedVisibility = typeof data.visibility === 'number' ? data.visibility.toFixed(1) : data.visibility;
            visibilityElement.textContent = `Visibility: ${formattedVisibility} km`;
        }
    }
    }
    
    // Update visibility separately
    if (visibilityElement) {
        if (data && data.visibility !== undefined) {
            // Check if visibility is already in km or needs conversion
            let visibilityKm;
            if (data.visibility > 100) { // Likely in meters
                visibilityKm = (data.visibility / 1000).toFixed(1);
            } else { // Already in km
                visibilityKm = data.visibility.toFixed(1);
            }
            visibilityElement.textContent = `Visibility: ${visibilityKm} km`;
        } else {
            visibilityElement.textContent = `Visibility: -- km`;
        }
    }
    
    // Update Wind
    const windElement = document.getElementById('wind-value');
    const windTrendElement = document.getElementById('wind-trend');
    if (windElement && data.wind_speed !== undefined) {
        const windDirection = getWindDirection(data.wind_deg);
        const windSpeed = data.wind_speed.toFixed(1);
        const windGust = data.wind_gust ? data.wind_gust.toFixed(1) : windSpeed;
        
        windElement.innerHTML = `${windSpeed} m/s ${windDirection}`;
        
        if (windTrendElement) {
            windTrendElement.innerHTML = `<i class="fas fa-wind"></i> Gusts: ${windGust} m/s`;
            windTrendElement.className = 'trend up';
        }
    }
    
    // Update Air Quality - FORCE UPDATE
    const airQualityElement = document.getElementById('air-quality-value');
    const airQualityTrendElement = document.getElementById('air-quality-trend');
    const airQualityDetailsElement = document.getElementById('air-quality-details');
    
    if (airQualityElement) {
        if (data.air_quality) {
            const aqi = data.air_quality.pm2_5 || 0;
            let airQualityStatus = 'Good';
            let statusClass = 'up';
            
            if (aqi > 10 && aqi <= 25) {
                airQualityStatus = 'Moderate';
                statusClass = 'neutral';
            } else if (aqi > 25 && aqi <= 50) {
                airQualityStatus = 'Poor';
                statusClass = 'down';
            } else if (aqi > 50) {
                airQualityStatus = 'Unhealthy';
                statusClass = 'down';
            }
            
            airQualityElement.innerHTML = `${airQualityStatus} `;
            
            if (airQualityTrendElement) {
                airQualityTrendElement.innerHTML = `<i class="fas fa-check"></i> AQI: ${Math.round(aqi)}`;
                airQualityTrendElement.className = `trend ${statusClass}`;
            }
            
            if (airQualityDetailsElement) {
                airQualityDetailsElement.innerHTML = `PM2.5: ${data.air_quality.pm2_5 || 'N/A'}, PM10: ${data.air_quality.pm10 || 'N/A'}, CO: ${data.air_quality.co || 'N/A'}, O₃: ${data.air_quality.o3 || 'N/A'}, NO₂: ${data.air_quality.no2 || 'N/A'}, SO₂: ${data.air_quality.so2 || 'N/A'}`;
            }
        } else {
            // If no air quality data, show default values
            airQualityElement.innerHTML = 'Moderate ';
            
            if (airQualityTrendElement) {
                airQualityTrendElement.innerHTML = `<i class="fas fa-check"></i> AQI: 15`;
                airQualityTrendElement.className = 'trend neutral';
            }
            
            if (airQualityDetailsElement) {
                airQualityDetailsElement.innerHTML = 'PM2.5: 15.0 μg/m³, PM10: 25.0 μg/m³';
            }
        }
    }


// Function to display geolocation error
function displayGeolocationError() {
    const elements = [
        'temperature-value',
        'humidity-value',
        'light-value',
        'air-quality-value',
        'moon-phase'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = 'Location access denied';
        }
    });
    
    // Clear location display
    const locationElement = document.getElementById('current-location');
    if (locationElement) {
        locationElement.textContent = 'Location unavailable';
    }
}

// Function to display weather error
function displayWeatherError() {
    const elements = [
        'temperature-value',
        'humidity-value',
        'light-value',
        'air-quality-value',
        'moon-phase'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = 'Weather data unavailable';
        }
    });
    
    // Clear air quality details
    const airQualityDetailsElement = document.getElementById('air-quality-details');
    if (airQualityDetailsElement) {
        airQualityDetailsElement.textContent = '';
    }
}