/**
 * EcoSphere Analytics Module
 * Handles all analytics charts and metrics display with real-time data fetching
 */

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log('Analytics page loaded');
    initializeAnalytics();
});

// Chart instances
let temperatureChart = null;
let airQualityChart = null;
let environmentalChart = null;

// Default timeframe
let currentTimeframe = 'day';

/**
 * Initialize analytics page
 */
function initializeAnalytics() {
    console.log('Initializing analytics');
    
    // Initialize metrics cards
    updateMetricsCards();
    
    // Setup timeframe buttons
    setupTimeframeButtons();
    
    // Initialize charts
    initializeTemperatureChart();
    initializeAirQualityChart();
    initializeEnvironmentalChart();
    
    // Initial update of all charts
    updateAllCharts(currentTimeframe);
    
    // Setup export button
    setupExportButton();
    
    // Set up auto-refresh every 5 minutes
    setInterval(function() {
        updateMetricsCards();
        updateAllCharts(currentTimeframe);
    }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Update all charts with the selected timeframe
 * @param {string} timeframe - The timeframe to display (day, week, month)
 */
function updateAllCharts(timeframe) {
    console.log(`Updating all charts for timeframe: ${timeframe}`);
    
    // Update current timeframe
    currentTimeframe = timeframe;
    
    // Update temperature chart
    updateTemperatureChart(timeframe);
    
    // Update air quality chart
    updateAirQualityChart(timeframe);
    
    // Update environmental chart (doesn't use timeframe)
    updateEnvironmentalChart();
    
    // Update active class on all timeframe buttons
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        if (btn.dataset.timeframe === timeframe) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update global timeframe buttons
    document.querySelectorAll('.global-timeframe .timeframe-btn').forEach(btn => {
        const btnTimeframe = btn.getAttribute('data-timeframe');
        if (btnTimeframe === timeframe) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Update metrics cards with latest data
 */
function updateMetricsCards() {
    console.log('Updating metrics cards');
    
    fetch('/dashboard/api/analytics/metrics')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Metrics data received:', data);
            
            // Update temperature card
            updateMetricCard(1, data.temperature, data.temperature_change, '°C');
            
            // Update humidity card
            updateMetricCard(2, data.humidity, data.humidity_change, '%');
            
            // Update light hours card
            updateMetricCard(3, data.light_hours, data.light_hours_change, 'h');
            
            // Update water changes card
            updateMetricCard(4, data.water_changes, data.water_changes_change, '');
        })
        .catch(error => {
            console.error('Error fetching metrics data:', error);
            // Use fallback data if API fails
            useFallbackMetricsData();
        });
}

/**
 * Update a specific metric card
 */
function updateMetricCard(cardIndex, value, change, unit) {
    const card = document.querySelector(`.metric-card:nth-child(${cardIndex})`);
    if (!card) return;
    
    const valueElement = card.querySelector('.value');
    const changeElement = card.querySelector('.change');
    
    if (valueElement && value !== undefined) {
        valueElement.textContent = `${value}${unit}`;
    }
    
    if (changeElement && change !== undefined) {
        // Determine if change is positive or negative
        const isPositive = change > 0;
        const changeClass = isPositive ? 'positive' : (change < 0 ? 'negative' : '');
        const changeIcon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
        const changePrefix = isPositive ? '+' : '';
        
        // Update change element
        changeElement.className = `change ${changeClass}`;
        changeElement.innerHTML = `${changePrefix}${change}${unit} <i class="fas ${changeIcon}"></i>`;
    }
}

/**
 * Use fallback data for metrics cards when API fails
 */
function useFallbackMetricsData() {
    console.log('Using fallback metrics data');
    
    // Default values from the HTML template
    updateMetricCard(1, 24.2, 0.5, '°C');
    updateMetricCard(2, 67, -2, '%');
    updateMetricCard(3, 14, 1, 'h');
    updateMetricCard(4, 3, 1, '');
}

/**
 * Setup timeframe buttons for all charts
 */
function setupTimeframeButtons() {
    console.log('Setting up timeframe buttons');
    
    const timeframeButtons = document.querySelectorAll('.timeframe-btn');
    
    timeframeButtons.forEach(button => {
        // Make sure the button is clickable
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
        
        // Remove any existing event listeners to prevent duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function(event) {
            // Get the timeframe from button data attribute
            const timeframe = this.dataset.timeframe;
            if (!timeframe) return;
            
            console.log(`Timeframe button clicked: ${timeframe}`);
            
            // Update current timeframe
            currentTimeframe = timeframe;
            
            // Find the parent chart card
            const chartCard = this.closest('.chart-card');
            if (!chartCard) return;
            
            // Remove active class from all buttons in this card
            const buttons = chartCard.querySelectorAll('.timeframe-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update all charts if global timeframe button is clicked
            if (chartCard.classList.contains('global-timeframe')) {
                updateAllCharts(timeframe);
                return;
            }
            
            // Update the appropriate chart
            if (chartCard.querySelector('#temperatureChart')) {
                updateTemperatureChart(timeframe);
            } else if (chartCard.querySelector('#airQualityChart')) {
                updateAirQualityChart(timeframe);
            }
            
            // Prevent default behavior
            event.preventDefault();
            return false;
        });
    });
}

/**
 * Initialize temperature chart
 */
function initializeTemperatureChart() {
    console.log('Initializing temperature chart');
    
    const ctx = document.getElementById('temperatureChart');
    if (!ctx) {
        console.error('Temperature chart canvas not found');
        return;
    }
    
    // Create gradient for chart background
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(255, 165, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 165, 0, 0.1)');
    
    // Create chart with empty data
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: 'rgb(255, 165, 0)',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: 'rgb(255, 165, 0)',
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#aaa'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#aaa'
                    }
                }
            }
        }
    });
    
    // Load initial data
    updateTemperatureChart('day');
}

/**
 * Update temperature chart with new data
 */
function updateTemperatureChart(timeframe) {
    console.log(`Updating temperature chart for timeframe: ${timeframe}`);
    
    fetch(`/dashboard/api/analytics/temperature?timeframe=${timeframe}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Temperature data received:', data);
            
            if (!temperatureChart) {
                console.error('Temperature chart not initialized');
                return;
            }
            
            // Format labels based on timeframe
            const labels = data.labels.map(date => {
                const dateObj = new Date(date);
                if (timeframe === 'day') {
                    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (timeframe === 'week') {
                    return dateObj.toLocaleDateString([], { weekday: 'short' });
                } else {
                    return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }
            });
            
            // Update chart data
            temperatureChart.data.labels = labels;
            temperatureChart.data.datasets[0].data = data.values;
            temperatureChart.update();
        })
        .catch(error => {
            console.error('Error fetching temperature data:', error);
            // Use sample data if API fails
            useSampleTemperatureData(timeframe);
        });
}

/**
 * Use sample temperature data when API fails
 */
function useSampleTemperatureData(timeframe) {
    console.log(`Using sample temperature data for timeframe: ${timeframe}`);
    
    let labels = [];
    let values = [];
    
    // Generate sample data based on timeframe
    if (timeframe === 'day') {
        // Hourly data for a day
        for (let i = 0; i < 24; i++) {
            labels.push(`${i}:00`);
            // Temperature curve that peaks in the afternoon
            const hour = i;
            const baseTemp = 20;
            const amplitude = 8;
            const peakHour = 14;
            const temp = baseTemp + amplitude * Math.exp(-0.1 * Math.pow(hour - peakHour, 2));
            values.push(temp.toFixed(1));
        }
    } else if (timeframe === 'week') {
        // Daily data for a week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const temps = [22.5, 23.8, 25.2, 24.7, 23.1, 22.0, 21.5];
        labels = days;
        values = temps;
    } else {
        // Daily data for a month (30 days)
        for (let i = 1; i <= 30; i++) {
            labels.push(`${i}`);
            // Temperature with a slight upward trend and some randomness
            const trend = 0.05 * i;
            const random = Math.random() * 2 - 1;
            const temp = 22 + trend + random;
            values.push(temp.toFixed(1));
        }
    }
    
    // Update chart with sample data
    if (temperatureChart) {
        temperatureChart.data.labels = labels;
        temperatureChart.data.datasets[0].data = values;
        temperatureChart.update();
    }
}

/**
 * Initialize air quality chart
 */
function initializeAirQualityChart() {
    console.log('Initializing air quality chart');
    
    const ctx = document.getElementById('airQualityChart');
    if (!ctx) {
        console.error('Air quality chart canvas not found');
        return;
    }
    
    // Create gradients for chart backgrounds
    const gradientPM25 = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradientPM25.addColorStop(0, 'rgba(138, 43, 226, 0.6)');
    gradientPM25.addColorStop(1, 'rgba(138, 43, 226, 0.1)');
    
    const gradientPM10 = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradientPM10.addColorStop(0, 'rgba(65, 105, 225, 0.6)');
    gradientPM10.addColorStop(1, 'rgba(65, 105, 225, 0.1)');
    
    // Create chart with empty data
    airQualityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'PM2.5',
                    data: [],
                    borderColor: 'rgb(138, 43, 226)',
                    backgroundColor: gradientPM25,
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(138, 43, 226)',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'PM10',
                    data: [],
                    borderColor: 'rgb(65, 105, 225)',
                    backgroundColor: gradientPM10,
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(65, 105, 225)',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#aaa',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#aaa'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#aaa'
                    }
                }
            }
        }
    });
    
    // Load initial data
    updateAirQualityChart('day');
}

/**
 * Update air quality chart with new data
 */
function updateAirQualityChart(timeframe) {
    console.log(`Updating air quality chart for timeframe: ${timeframe}`);
    
    fetch(`/dashboard/api/analytics/air-quality?timeframe=${timeframe}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Air quality data received:', data);
            
            if (!airQualityChart) {
                console.error('Air quality chart not initialized');
                return;
            }
            
            // Format labels based on timeframe
            const labels = data.labels.map(date => {
                const dateObj = new Date(date);
                if (timeframe === 'day') {
                    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (timeframe === 'week') {
                    return dateObj.toLocaleDateString([], { weekday: 'short' });
                } else {
                    return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }
            });
            
            // Extract PM2.5 and PM10 values from the data
            const pm25Values = [];
            const pm10Values = [];
            
            // Check if we have the detailed PM data
            if (data.pm2_5_values && data.pm10_values) {
                // If we have separate arrays for PM2.5 and PM10
                pm25Values.push(...data.pm2_5_values);
                pm10Values.push(...data.pm10_values);
            } else {
                // If we have result array with pm2_5 and pm10 properties
                data.result?.forEach(item => {
                    if (item.pm2_5 !== undefined) pm25Values.push(item.pm2_5);
                    if (item.pm10 !== undefined) pm10Values.push(item.pm10);
                });
            }
            
            // Update chart data
            airQualityChart.data.labels = labels;
            
            // Update PM2.5 dataset
            airQualityChart.data.datasets[0].data = pm25Values.length > 0 ? pm25Values : data.values;
            
            // Update PM10 dataset
            if (pm10Values.length > 0) {
                airQualityChart.data.datasets[1].data = pm10Values;
            } else {
                // If no PM10 data, use a modified version of PM2.5 or values for visualization
                const fallbackData = data.values ? data.values.map(v => v * 1.5) : [];
                airQualityChart.data.datasets[1].data = fallbackData;
            }
            
            airQualityChart.update();
        })
        .catch(error => {
            console.error('Error fetching air quality data:', error);
            // Use sample data if API fails
            useSampleAirQualityData(timeframe);
        });
}

/**
 * Use sample air quality data when API fails
 */
function useSampleAirQualityData(timeframe) {
    console.log(`Using sample air quality data for timeframe: ${timeframe}`);
    
    let labels = [];
    let pm25Values = [];
    let pm10Values = [];
    
    // Generate sample data based on timeframe
    if (timeframe === 'day') {
        // Hourly data for a day
        for (let i = 0; i < 24; i++) {
            labels.push(`${i}:00`);
            
            // PM2.5 curve that is worse during rush hours
            const hour = i;
            const basePM25 = 15.0; // Base PM2.5 value (μg/m³)
            const morningPeakPM25 = Math.max(0, 8 * Math.exp(-0.5 * Math.pow(hour - 8, 2)));
            const eveningPeakPM25 = Math.max(0, 6 * Math.exp(-0.5 * Math.pow(hour - 18, 2)));
            const pm25 = basePM25 + morningPeakPM25 + eveningPeakPM25 + (Math.random() * 2 - 1);
            pm25Values.push(pm25.toFixed(1));
            
            // PM10 is typically higher than PM2.5
            const basePM10 = 25.0; // Base PM10 value (μg/m³)
            const morningPeakPM10 = Math.max(0, 12 * Math.exp(-0.5 * Math.pow(hour - 8, 2)));
            const eveningPeakPM10 = Math.max(0, 10 * Math.exp(-0.5 * Math.pow(hour - 18, 2)));
            const pm10 = basePM10 + morningPeakPM10 + eveningPeakPM10 + (Math.random() * 3 - 1.5);
            pm10Values.push(pm10.toFixed(1));
        }
    } else if (timeframe === 'week') {
        // Daily data for a week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const pm25Data = [14.5, 16.2, 15.8, 13.9, 17.1, 12.8, 11.5];
        const pm10Data = [24.8, 27.5, 26.3, 23.7, 29.4, 22.1, 19.8];
        
        labels = days;
        pm25Values = pm25Data;
        pm10Values = pm10Data;
    } else {
        // Daily data for a month (30 days)
        for (let i = 1; i <= 30; i++) {
            labels.push(`${i}`);
            
            // PM2.5 with a slight fluctuation and some randomness
            const cyclePM25 = 3 * Math.sin(i / 5);
            const randomPM25 = Math.random() * 2 - 1;
            const pm25 = 15 + cyclePM25 + randomPM25;
            pm25Values.push(pm25.toFixed(1));
            
            // PM10 with similar pattern but higher values
            const cyclePM10 = 5 * Math.sin(i / 5);
            const randomPM10 = Math.random() * 3 - 1.5;
            const pm10 = 25 + cyclePM10 + randomPM10;
            pm10Values.push(pm10.toFixed(1));
        }
    }
    
    // Update chart with sample data
    if (airQualityChart) {
        airQualityChart.data.labels = labels;
        airQualityChart.data.datasets[0].data = pm25Values;
        airQualityChart.data.datasets[1].data = pm10Values;
        airQualityChart.update();
    }
}

/**
 * Initialize environmental trends chart
 */
function initializeEnvironmentalChart() {
    console.log('Initializing environmental trends chart');
    
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) {
        console.error('Environmental trends chart canvas not found');
        return;
    }
    
    // Create chart with empty data
    environmentalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Carbon Footprint (kg CO₂)',
                    data: [],
                    borderColor: 'rgb(75, 192, 75)',
                    backgroundColor: 'rgba(75, 192, 75, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(75, 192, 75)',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Energy Usage (kWh)',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#aaa'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#aaa'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#aaa'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#aaa'
                    }
                }
            }
        }
    });
    
    // Load initial data
    updateEnvironmentalChart();
}

/**
 * Update environmental trends chart with new data
 */
function updateEnvironmentalChart() {
    console.log('Updating environmental trends chart');
    
    fetch('/dashboard/api/analytics/environmental')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Environmental data received:', data);
            
            if (!environmentalChart) {
                console.error('Environmental chart not initialized');
                return;
            }
            
            // Format dates for labels
            const labels = data.dates.map(date => {
                const dateObj = new Date(date);
                return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
            });
            
            // Update chart data
            environmentalChart.data.labels = labels;
            environmentalChart.data.datasets[0].data = data.carbon_values;
            environmentalChart.data.datasets[1].data = data.energy_values;
            environmentalChart.update();
        })
        .catch(error => {
            console.error('Error fetching environmental data:', error);
            // Use sample data if API fails
            useSampleEnvironmentalData();
        });
}

/**
 * Use sample environmental data when API fails
 */
function useSampleEnvironmentalData() {
    console.log('Using sample environmental data');
    
    // Generate dates for the past 30 days
    const dates = [];
    const carbonValues = [];
    const energyValues = [];
    
    const today = new Date();
    
    // Generate sample data for the past 30 days
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
        
        // Carbon footprint with a decreasing trend (improvement)
        const carbonBase = 140;
        const carbonTrend = -0.8 * i;
        const carbonRandom = Math.random() * 10 - 5;
        const carbon = Math.max(0, carbonBase + carbonTrend + carbonRandom);
        carbonValues.push(carbon.toFixed(1));
        
        // Energy usage with a decreasing trend (improvement)
        const energyBase = 180;
        const energyTrend = -0.7 * i;
        const energyRandom = Math.random() * 15 - 7.5;
        const energy = Math.max(0, energyBase + energyTrend + energyRandom);
        energyValues.push(energy.toFixed(1));
    }
    
    // Update chart with sample data
    if (environmentalChart) {
        environmentalChart.data.labels = dates;
        environmentalChart.data.datasets[0].data = carbonValues;
        environmentalChart.data.datasets[1].data = energyValues;
        environmentalChart.update();
    }
}

/**
 * Update all charts with the current timeframe
 */
function updateAllCharts(timeframe) {
    console.log('Updating all charts with timeframe:', timeframe);
    updateTemperatureChart(timeframe);
    updateAirQualityChart(timeframe);
    updateEnvironmentalChart();
}

/**
 * Update a specific chart based on its ID
 */
function updateChart(chartId, timeframe) {
    console.log(`Updating chart ${chartId} with timeframe: ${timeframe}`);
    
    switch(chartId) {
        case 'temperature':
            updateTemperatureChart(timeframe);
            break;
        case 'airQuality':
            updateAirQualityChart(timeframe);
            break;
        case 'environmental':
            updateEnvironmentalChart();
            break;
        default:
            console.error(`Unknown chart ID: ${chartId}`);
    }
}

/**
 * Setup export button functionality
 */
function setupExportButton() {
    console.log('Setting up export button');
    
    const exportBtn = document.getElementById('exportDataBtn');
    const exportOptions = document.querySelectorAll('.export-dropdown a');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = document.querySelector('.export-dropdown');
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    exportOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const format = this.dataset.type;
            exportAnalyticsData(format);
            document.querySelector('.export-dropdown').style.display = 'none';
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.export-container')) {
            const dropdown = document.querySelector('.export-dropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    });
}

/**
 * Export analytics data in various formats
 */
function exportAnalyticsData(format) {
    console.log(`Exporting analytics data in ${format} format`);
    
    // Fetch all analytics data for export
    fetch('/dashboard/api/analytics/export?format=' + format)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            
            // Handle different response types based on format
            if (format === 'json') {
                return response.json().then(data => {
                    // Create a downloadable JSON file
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    downloadFile(url, `ecosphere_analytics_${formatDate(new Date())}.json`);
                });
            } else if (format === 'csv') {
                return response.text().then(text => {
                    // Create a downloadable CSV file
                    const blob = new Blob([text], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    downloadFile(url, `ecosphere_analytics_${formatDate(new Date())}.csv`);
                });
            } else {
                // For other formats, use the blob directly
                return response.blob().then(blob => {
                    const url = URL.createObjectURL(blob);
                    downloadFile(url, `ecosphere_analytics_${formatDate(new Date())}.${format}`);
                });
            }
        })
        .catch(error => {
            console.error('Error exporting analytics data:', error);
            alert('Failed to export data. Please try again later.');
        });
}

/**
 * Helper function to download a file
 */
function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Format date for filenames
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}