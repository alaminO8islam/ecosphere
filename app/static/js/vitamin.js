// DOM Elements
    const autoDetectBtn = document.getElementById('auto-detect');
    const manualInputBtn = document.getElementById('manual-input');
    const autoSection = document.getElementById('auto-section');
    const manualSection = document.getElementById('manual-section');
    const getLocationBtn = document.getElementById('get-location');
    const calculateBtn = document.getElementById('calculate-btn');
    const autoDetectUvBtn = document.getElementById('auto-detect-uv');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Chart initialization
    let vitaminChart;
    const ctx = document.getElementById('vitaminChart').getContext('2d');
    
    // Initialize the chart with empty data
    function initChart() {
      vitaminChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM'],
          datasets: [{
            label: 'UV Intensity',
            data: [0, 3, 8, 5, 1],
            borderColor: '#1a73e8',
            backgroundColor: 'rgba(26, 115, 232, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Daily UV Index Pattern'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 10,
              title: {
                display: true,
                text: 'UV Index'
              }
            }
          }
        }
      });
    }
    
    // Update chart with new data
    function updateChart(uvData) {
      if (vitaminChart) {
        vitaminChart.data.datasets[0].data = uvData;
        vitaminChart.update();
      }
    }
    
    // Tab switching functionality
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show active tab content
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
          }
        });
      });
    });
    
    // Toggle between auto and manual location detection
    autoDetectBtn.addEventListener('click', () => {
      autoDetectBtn.classList.add('active');
      manualInputBtn.classList.remove('active');
      autoSection.style.display = 'block';
      manualSection.style.display = 'none';
    });
    
    manualInputBtn.addEventListener('click', () => {
      manualInputBtn.classList.add('active');
      autoDetectBtn.classList.remove('active');
      manualSection.style.display = 'block';
      autoSection.style.display = 'none';
    });
    
    // Get user's location
getLocationBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        
        // Store location in session storage and localStorage for persistence
        sessionStorage.setItem('userLatitude', latitude);
        sessionStorage.setItem('userLongitude', longitude);
        localStorage.setItem('weatherLatitude', latitude);
        localStorage.setItem('weatherLongitude', longitude);
        
        // Update UI to show location is detected
        updateLocationUI(true);
        
        // Get UV data using the location
        const success = await getUvData(latitude, longitude);
        
        // If UV data fetch failed, update UI accordingly
        if (!success) {
          updateLocationUI(false);
        }
      },
      error => {
        updateLocationUI(false);
        alert('Unable to retrieve your location. Please try manual input.');
        console.error('Geolocation error:', error);
      }
    );
  } else {
    alert('Geolocation is not supported by this browser. Please use manual input.');
  }
});
    
    // Auto detect UV button
autoDetectUvBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        
        // Store location in session storage and localStorage for persistence
        sessionStorage.setItem('userLatitude', latitude);
        sessionStorage.setItem('userLongitude', longitude);
        localStorage.setItem('weatherLatitude', latitude);
        localStorage.setItem('weatherLongitude', longitude);
        
        // Update UI to show location is detected
        updateLocationUI(true);
        
        // Get UV data using the location
        const success = await getUvData(latitude, longitude);
        
        // If UV data fetch failed, update UI accordingly
        if (!success) {
          updateLocationUI(false);
          alert('Failed to retrieve UV data. Please enter UV index manually.');
        }
      },
      error => {
        updateLocationUI(false);
        alert('Unable to retrieve your location. Please enter UV index manually.');
        console.error('Geolocation error:', error);
      }
    );
  } else {
    alert('Geolocation is not supported by this browser. Please enter UV index manually.');
  }
});
    
    // Get UV data from API
    async function getUvData(lat, lng) {
      try {
        // Show loading indicator
        document.getElementById('current-uv').textContent = 'Loading...';
        
        // Use the backend API endpoint instead of directly calling OpenUV API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetch('/vitamin/api/check', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
        
        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.uv_index !== undefined) {
          const uvIndex = data.uv_index;
          document.getElementById('uv-index-input').value = uvIndex.toFixed(1);
          document.getElementById('current-uv').textContent = uvIndex.toFixed(1);
          
          // Update chart with realistic data based on current UV
          const hour = new Date().getHours();
          const simulatedData = simulateDailyUvPattern(hour, uvIndex);
          updateChart(simulatedData);
          
          // If there's a recommendation, display it
          if (data.recommendation) {
            document.getElementById('vitamin-advice').textContent = `Advice: ${data.recommendation}`;
          }
          
          return true;
        }
      } catch (err) {
        console.error('Error fetching UV data:', err);
        
        // Check if it's an abort error (timeout)
        if (err.name === 'AbortError') {
          alert('Request timed out. Using default UV values.');
        } else {
          alert('Failed to retrieve UV data. Using default values.');
        }
        
        // Set a reasonable default if the API call fails
        document.getElementById('uv-index-input').value = '5.0';
        document.getElementById('current-uv').textContent = '5.0';
        
        // Update chart with default data
        const hour = new Date().getHours();
        const simulatedData = simulateDailyUvPattern(hour, 5.0);
        updateChart(simulatedData);
      }
      
      return false;
    }
    
    // Simulate a daily UV pattern based on current UV and time
    function simulateDailyUvPattern(currentHour, currentUv) {
      // Peak UV is typically around noon (12 PM)
      const peakHour = 12;
      const basePattern = [0.5, 2, 5, 3, 1]; // Base pattern for 6AM, 9AM, 12PM, 3PM, 6PM
      
      // Adjust based on current UV reading
      const scaleFactor = currentUv / basePattern[2]; // basePattern[2] is the noon value
      
      return basePattern.map(value => (value * scaleFactor).toFixed(1));
    }
    
    // Calculate Vitamin D
    calculateBtn.addEventListener('click', () => {
      const skinType = parseInt(document.getElementById('skin-type').value);
      const ageGroup = document.getElementById('age-group').value;
      const gender = document.getElementById('gender').value;
      const weight = parseFloat(document.getElementById('weight').value);
      const exposure = parseFloat(document.getElementById('exposure-time').value);
      const uvInput = parseFloat(document.getElementById('uv-index-input').value);
      const serum = document.getElementById('serum-level').value ? 
                    parseFloat(document.getElementById('serum-level').value) : null;
      
      // Validate inputs
      if (!uvInput || uvInput <= 0) {
        alert('Please enter a valid UV index');
        return;
      }
      
      // Calculate safe exposure time based on skin type
      const safeExposure = 15 * (7 - skinType);
      document.getElementById('recommended-time').textContent = `${safeExposure} min`;
      
      // Skin factor
      let skinFactor = 1;
      if (skinType === 1) skinFactor = 1.2;
      else if (skinType === 6) skinFactor = 0.6;
      
      // Vitamin D estimate
      let vitaminD = (uvInput * exposure * skinFactor * 10) * (70 / weight);
      
      // Adjust based on serum level if provided
      if (serum !== null) {
        if (serum < 20) vitaminD *= 1.3;
        else if (serum >= 30) vitaminD *= 0.8;
      }
      
      // Adjust based on age group
      if (ageGroup === 'child') vitaminD *= 1.1;
      else if (ageGroup === 'senior') vitaminD *= 0.8;
      
      const now = new Date();
      const currentHour = now.getHours();
      
      // Generate advice
      const advice = generateAdvice(gender, ageGroup, skinType, exposure, vitaminD, serum, safeExposure, uvInput, currentHour);
      
      // Update UI with results
      document.getElementById('vitamin-amount').textContent = `Estimated Vitamin D: ${vitaminD.toFixed(0)} IU`;
      document.getElementById('vitamin-advice').textContent = `Advice: ${advice}`;
      document.getElementById('vitamin-level').textContent = `${vitaminD.toFixed(0)} IU`;
      
      // Update progress bar
      let barColor, statusText;
      if (vitaminD < 600) {
        barColor = '#d63031'; // red
        statusText = 'Deficient';
      } else if (vitaminD <= 4000) {
        barColor = '#00b894'; // green
        statusText = 'Optimal';
      } else {
        barColor = '#fdcb6e'; // orange
        statusText = 'Overexposed';
      }
      
      const percentage = Math.min((vitaminD / 4000) * 100, 100);
      const progressBar = document.getElementById('progressBar');
      progressBar.style.width = `${percentage}%`;
      progressBar.style.background = barColor;
      progressBar.textContent = statusText;
    });
    
    // Generate personalized advice
    function generateAdvice(gender, ageGroup, skinType, exposure, vitaminD, serum, safeExposure, uvIndex, currentHour) {
      let advice = "";
      
      // Vitamin D Range
      if (vitaminD < 600) {
        advice += "You're Vitamin D deficient. Increase sun exposure and consider dietary sources. ";
      } else if (vitaminD <= 4000) {
        advice += "Your Vitamin D level is optimal. Maintain your current habits. ";
      } else {
        advice += "You've exceeded safe Vitamin D levels. Reduce sun exposure. ";
      }
      
      // Time of Day Analysis
      if (currentHour < 10) {
        advice += "Morning sun is gentle and effective for Vitamin D production. ";
      } else if (currentHour < 14) {
        advice += "Midday sun is strongest. Limit exposure to avoid skin damage. ";
      } else if (currentHour < 17) {
        advice += "Afternoon sun is still beneficial but requires longer exposure. ";
      } else {
        advice += "Evening/night: No UVB rays available for Vitamin D synthesis. ";
      }
      
      // Skin Type Guidance
      if (skinType === 1) {
        advice += "Your fair skin produces Vitamin D quickly but burns easily. Use protection after 10-15 minutes. ";
      } else if (skinType === 6) {
        advice += "Your dark skin has natural sun protection but requires longer exposure for Vitamin D. ";
      } else {
        advice += "Your skin type allows for moderate sun exposure. ";
      }
      
      // Exposure Safety
      if (exposure > safeExposure) {
        advice += "You exceeded the safe exposure time for your skin type. ";
      } else if (exposure < safeExposure / 2) {
        advice += "Consider increasing your exposure time slightly for better Vitamin D synthesis. ";
      } else {
        advice += "Your exposure time was within the safe and effective range. ";
      }
      
      return advice;
    }
    
    // Check if location data exists in localStorage/sessionStorage
async function checkStoredLocation() {
  const lat = localStorage.getItem('weatherLatitude') || sessionStorage.getItem('userLatitude');
  const lng = localStorage.getItem('weatherLongitude') || sessionStorage.getItem('userLongitude');
  
  if (lat && lng) {
    // Update UI to show location is already detected
    updateLocationUI(true);
    // Use the stored location to get UV data
    const success = await getUvData(lat, lng);
    // If UV data fetch failed, update UI accordingly
    if (!success) {
      updateLocationUI(false);
    }
    return success;
  }
  
  return false;
}

// Update the location button UI based on detection status
function updateLocationUI(detected) {
  if (detected) {
    getLocationBtn.innerHTML = '<i class="fas fa-check"></i> Location Detected';
    getLocationBtn.classList.add('detected');
    
    // Show the latitude and longitude if available
    const lat = localStorage.getItem('weatherLatitude') || sessionStorage.getItem('userLatitude');
    const lng = localStorage.getItem('weatherLongitude') || sessionStorage.getItem('userLongitude');
    if (lat && lng) {
      // Add location info to the auto-section paragraph
      const autoSection = document.getElementById('auto-section');
      if (autoSection && autoSection.querySelector('p')) {
        autoSection.querySelector('p').innerHTML = `Using location: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
      }
    }
  } else {
    getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Detect My Location';
    getLocationBtn.classList.remove('detected');
    
    // Reset the auto-section paragraph
    const autoSection = document.getElementById('auto-section');
    if (autoSection && autoSection.querySelector('p')) {
      autoSection.querySelector('p').innerHTML = "We'll use your device's location to get accurate UV data";
    }
  }
}

// Initialize the application
async function initApp() {
  initChart();
  
  // Set default UV index to a reasonable value
  document.getElementById('uv-index-input').value = '5.0';
  document.getElementById('current-uv').textContent = '5.0';
  
  // Simulate initial chart data
  const simulatedData = simulateDailyUvPattern(new Date().getHours(), 5.0);
  updateChart(simulatedData);
  
  // Check if location is already stored
  await checkStoredLocation();
}
    
    // Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add CSS for detected location button
  const style = document.createElement('style');
  style.textContent = `
    #get-location.detected {
      background-color: #4CAF50 !important; /* Green color for success */
      border-color: #4CAF50 !important;
    }
  `;
  document.head.appendChild(style);
  
  // Initialize the app (async function)
  initApp().then(() => {
    // Check for location permission status after app is initialized
    checkLocationPermission();
  });
});

// Check for location permission status
function checkLocationPermission() {
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' })
      .then(permissionStatus => {
        if (permissionStatus.state === 'granted') {
          // If permission is already granted, check for stored location
          checkStoredLocation().then(hasStoredLocation => {
            if (!hasStoredLocation) {
              // If no stored location, try to get it automatically
              getLocationBtn.click();
            }
          });
        }
        
        // Listen for changes to permission state
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'granted') {
            getLocationBtn.click();
          }
        };
      });
  }
}