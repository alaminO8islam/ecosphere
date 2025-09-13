/**
 * Sunrise-Sunset Data Handler for EcoSphere Dashboard
 */

// Function to fetch sunrise and sunset data using OpenUV API
async function fetchSunriseSunsetData() {
    try {
        console.log('Fetching sunrise/sunset data...');
        // Get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                console.log('Location obtained:', latitude, longitude);
                
                // Get user's timezone offset in minutes
                const timezoneOffset = new Date().getTimezoneOffset();
                
                // Call the backend API which uses OpenUV API
                const response = await fetch(`/dashboard/api/sun?lat=${latitude}&lon=${longitude}&timezone_offset=${timezoneOffset}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch sunrise/sunset data');
                }
                
                const data = await response.json();
                console.log('Sunrise/sunset data received:', data);
                
                // Update the dashboard with sunrise and sunset times
                updateSunriseSunsetCards(data);
            }, handleLocationError);
        } else {
            throw new Error('Geolocation is not supported by this browser.');
        }
    } catch (error) {
        console.error('Error fetching sunrise/sunset data:', error);
        displayErrorOnCards();
    }
}

// Function to update the sunrise and sunset cards with data
function updateSunriseSunsetCards(data) {
    const sunriseElement = document.getElementById('sunrise-value');
    const sunsetElement = document.getElementById('sunset-value');
    
    if (sunriseElement && data.sunrise) {
        // Check if the data is already formatted (string) or needs formatting (Date object)
        if (typeof data.sunrise === 'string' && data.sunrise.includes(':')) {
            // Already formatted time string (e.g. "07:30 AM")
            sunriseElement.innerHTML = data.sunrise;
            console.log('Sunrise time updated:', data.sunrise);
        } else {
            // Format the time for display
            const sunriseTime = new Date(data.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            sunriseElement.innerHTML = sunriseTime;
            console.log('Sunrise time updated:', sunriseTime);
        }
    } else {
        console.error('Unable to update sunrise time:', sunriseElement, data.sunrise);
    }
    
    if (sunsetElement && data.sunset) {
        // Check if the data is already formatted (string) or needs formatting (Date object)
        if (typeof data.sunset === 'string' && data.sunset.includes(':')) {
            // Already formatted time string (e.g. "07:30 PM")
            sunsetElement.innerHTML = data.sunset;
            console.log('Sunset time updated:', data.sunset);
        } else {
            // Format the time for display
            const sunsetTime = new Date(data.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            sunsetElement.innerHTML = sunsetTime;
            console.log('Sunset time updated:', sunsetTime);
        }
    } else {
        console.error('Unable to update sunset time:', sunsetElement, data.sunset);
    }
}

// Function to handle location errors
function handleLocationError(error) {
    console.error('Geolocation error:', error);
    displayErrorOnCards();
}

// Function to display error message on cards
function displayErrorOnCards() {
    const sunriseElement = document.getElementById('sunrise-value');
    const sunsetElement = document.getElementById('sunset-value');
    
    if (sunriseElement) {
        sunriseElement.innerHTML = 'Unable to fetch data';
    }
    
    if (sunsetElement) {
        sunsetElement.innerHTML = 'Unable to fetch data';
    }
    
    // Try again after 30 seconds in case of temporary API issues
    setTimeout(fetchSunriseSunsetData, 30000);
}

// Initialize the sunrise and sunset data when the page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchSunriseSunsetData();
    
    // Refresh data every 30 minutes
    setInterval(fetchSunriseSunsetData, 30 * 60 * 1000);
});