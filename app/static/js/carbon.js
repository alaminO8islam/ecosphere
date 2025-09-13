/**
 * Carbon Footprint Tracker JavaScript
 * Handles data updates, calculations, and visualization for carbon footprint tracking
 */

// Global variables
let co2Chart;
let transportData = 0;
let foodData = 0;
let energyData = 0;
let carbonHistory = [];

/**
 * Initialize the carbon footprint tracking functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Carbon.js loaded');
    
    // Initialize event listeners
    initEventListeners();
    
    // Load carbon data
    loadCarbonData();
    
    // Initialize the CO2 impact visualization
    setTimeout(function() {
        initializeCO2Impact();
        console.log('CO2 Impact visualization initialized');
        // Force update the visualization after initialization
        setTimeout(() => {
            updateCO2Chart();
        }, 500);
    }, 500);
});

/**
 * Initialize event listeners for the carbon footprint page
 */
function initEventListeners() {
    // Category selection for the footprint audit tool
    const categorySelect = document.getElementById('category-select');
    const logEntryBtn = document.getElementById('log-entry');
    
    if (categorySelect && logEntryBtn) {
        categorySelect.addEventListener('change', function() {
            // Update dynamic inputs based on selected category
            updateDynamicInputs(this.value);
        });
        
        logEntryBtn.addEventListener('click', function() {
            // Open the appropriate calculator popup
            const category = categorySelect.value;
            openPopup(`popup-${category}`);
        });
    }
    
    // Add message event listener to receive data from iframes
    window.addEventListener('message', function(event) {
        // Check if the message is from our calculators
        if (event.data && (event.data.type === 'carbonCalculation' || event.data.type === 'carbon_update')) {
            handleCarbonCalculation(event.data);
        }
    });
}

/**
 * Open a popup calculator
 * @param {string} popupId - The ID of the popup to open
 */
function openPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'flex';
    }
}

/**
 * Close a popup calculator
 * @param {string} popupId - The ID of the popup to close
 */
function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'none';
    }
}

/**
 * Handle carbon calculation data from calculator iframes
 * @param {Object} data - The calculation data
 */
function handleCarbonCalculation(data) {
    // Extract the calculation data
    const { category, value } = data;
    
    // Update the appropriate category value
    switch (category) {
        case 'transport':
            transportData = value;
            break;
        case 'food':
            foodData = value;
            break;
        case 'energy':
            energyData = value;
            break;
    }
    
    // If this is a direct update from a calculator popup, no need to save again
    if (data.type === 'carbon_update') {
        // Just update the UI and chart
        loadCarbonData();
        return;
    }
    
    // Save the data to the database
    saveCarbonData(category, value);
    
    // Update the UI
    updateCarbonUI();
    
    // Close the popup
    closePopup(`popup-${category}`);
}

/**
 * Save carbon data to the database
 * @param {string} category - The category of carbon data
 * @param {number} value - The carbon value
 */
function saveCarbonData(category, value) {
    // Prepare the data to send
    const data = {
        transport: category === 'transport' ? value : 0,
        food: category === 'food' ? value : 0,
        energy: category === 'energy' ? value : 0
    };
    
    // Send the data to the server
    fetch('/api/carbon/api/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Carbon data saved:', result);
        // Reload carbon data to update the UI
        loadCarbonData();
    })
    .catch(error => {
        console.error('Error saving carbon data:', error);
    });
}

/**
 * Load carbon data from the server
 */
function loadCarbonData() {
    console.log('Loading carbon data...');
    fetch('/api/carbon/api/history')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Carbon data loaded:', data);
            // Store the carbon history
            carbonHistory = data;
            
            // Update the UI with the latest data
            updateCarbonUI();
            
            // Update the chart
            updateCO2Chart();
        })
        .catch(error => {
            console.error('Error loading carbon data:', error);
        });
}

/**
 * Update the carbon footprint UI elements
 */
function updateCarbonUI() {
    console.log('Updating carbon UI...');
    // Calculate totals for each category
    let transportTotal = 0;
    let foodTotal = 0;
    let energyTotal = 0;
    
    // Get the latest data points for each category
    if (carbonHistory && carbonHistory.length > 0) {
        console.log('Carbon history available, calculating totals...');
        
        // Calculate totals from all entries (not just daily)
        transportTotal = carbonHistory.reduce((sum, entry) => sum + parseFloat(entry.transport || 0), 0);
        foodTotal = carbonHistory.reduce((sum, entry) => sum + parseFloat(entry.food || 0), 0);
        energyTotal = carbonHistory.reduce((sum, entry) => sum + parseFloat(entry.energy || 0), 0);
        
        console.log('Total carbon values:', { transport: transportTotal, food: foodTotal, energy: energyTotal });
        
        // Also get daily totals for trend indicators
        const dailyData = getDailyTotals();
        console.log('Daily totals:', dailyData);
        
        // Update trend indicators
        updateTrendIndicators(dailyData, getWeeklyTotals(), getMonthlyTotals());
    } else {
        console.log('No carbon history available');
    }
    
    // Update the UI elements
    const transportElement = document.getElementById('transport-co2');
    const foodElement = document.getElementById('food-co2');
    const energyElement = document.getElementById('energy-co2');
    
    console.log('UI elements:', { 
        transportElement: transportElement ? 'found' : 'not found', 
        foodElement: foodElement ? 'found' : 'not found', 
        energyElement: energyElement ? 'found' : 'not found' 
    });
    
    // Force update the UI elements with the calculated values
    if (transportElement) {
        transportElement.textContent = `${transportTotal.toFixed(2)} kg`;
        console.log('Updated transport element:', transportElement.textContent);
    }
    
    if (foodElement) {
        foodElement.textContent = `${foodTotal.toFixed(2)} kg`;
        console.log('Updated food element:', foodElement.textContent);
    }
    
    if (energyElement) {
        energyElement.textContent = `${energyTotal.toFixed(2)} kWh`;
        console.log('Updated energy element:', energyElement.textContent);
    }
    
    // Also update the chart
    updateCO2Chart();
}

/**
 * Get daily totals from carbon history
 * @returns {Object} The daily totals for each category
 */
function getDailyTotals() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter for today's entries
    const todayEntries = carbonHistory.filter(entry => {
        const entryDate = new Date(entry.logged_at);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
    });
    
    // Calculate totals
    return {
        transport: todayEntries.reduce((sum, entry) => sum + entry.transport, 0),
        food: todayEntries.reduce((sum, entry) => sum + entry.food, 0),
        energy: todayEntries.reduce((sum, entry) => sum + entry.energy, 0)
    };
}

/**
 * Get weekly totals from carbon history
 * @returns {Object} The weekly totals for each category
 */
function getWeeklyTotals() {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    // Filter for this week's entries
    const weekEntries = carbonHistory.filter(entry => {
        const entryDate = new Date(entry.logged_at);
        return entryDate >= oneWeekAgo && entryDate <= today;
    });
    
    // Calculate totals
    return {
        transport: weekEntries.reduce((sum, entry) => sum + entry.transport, 0),
        food: weekEntries.reduce((sum, entry) => sum + entry.food, 0),
        energy: weekEntries.reduce((sum, entry) => sum + entry.energy, 0)
    };
}

/**
 * Get monthly totals from carbon history
 * @returns {Object} The monthly totals for each category
 */
function getMonthlyTotals() {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    // Filter for this month's entries
    const monthEntries = carbonHistory.filter(entry => {
        const entryDate = new Date(entry.logged_at);
        return entryDate >= oneMonthAgo && entryDate <= today;
    });
    
    // Calculate totals
    return {
        transport: monthEntries.reduce((sum, entry) => sum + entry.transport, 0),
        food: monthEntries.reduce((sum, entry) => sum + entry.food, 0),
        energy: monthEntries.reduce((sum, entry) => sum + entry.energy, 0)
    };
}

/**
 * Update trend indicators based on data comparisons
 * @param {Object} dailyData - Daily carbon totals
 * @param {Object} weeklyData - Weekly carbon totals
 * @param {Object} monthlyData - Monthly carbon totals
 */
function updateTrendIndicators(dailyData, weeklyData, monthlyData) {
    // Get the trend elements
    const transportTrend = document.querySelector('.stat-card.transport .trend');
    const foodTrend = document.querySelector('.stat-card.food .trend');
    const energyTrend = document.querySelector('.stat-card.energy .trend');
    
    if (transportTrend) {
        // Compare daily transport with previous day average
        const prevDayAvg = (weeklyData.transport - dailyData.transport) / 6; // Assuming 7 days in a week
        const transportTrendUp = dailyData.transport <= prevDayAvg;
        transportTrend.className = `trend ${transportTrendUp ? 'down' : 'up'}`;
        transportTrend.innerHTML = `<i class="fas fa-arrow-${transportTrendUp ? 'down' : 'up'}"></i> Daily`;
    }
    
    if (foodTrend) {
        // Compare weekly food with previous week
        const foodTrendUp = weeklyData.food <= monthlyData.food / 4; // Assuming 4 weeks in a month
        foodTrend.className = `trend ${foodTrendUp ? 'down' : 'up'}`;
        foodTrend.innerHTML = `<i class="fas fa-arrow-${foodTrendUp ? 'down' : 'up'}"></i> Weekly`;
    }
    
    if (energyTrend) {
        // For energy, we'll use a chart icon instead of up/down
        energyTrend.innerHTML = `<i class="fas fa-chart-line"></i> Monthly`;
    }
}

/**
 * Initialize the CO2 impact visualization
 */
function initializeCO2Impact() {
    console.log('Initializing CO2 impact visualization...');
    
    // Reset the impact bars to zero
    updateImpactBars(0, 0, 0);
    
    // Update with actual data if available
    if (carbonHistory && carbonHistory.length > 0) {
        const monthlyTotals = getMonthlyTotals();
        updateImpactBars(
            monthlyTotals.transport,
            monthlyTotals.food,
            monthlyTotals.energy
        );
    }
}

/**
 * Update the impact bars with the given values
 * @param {number} transport - Transport carbon value
 * @param {number} food - Food carbon value
 * @param {number} energy - Energy carbon value
 */
function updateImpactBars(transport, food, energy) {
    console.log('Updating impact bars with:', { transport, food, energy });
    
    // Get the bar elements
    const transportBar = document.getElementById('transport-impact-bar');
    const foodBar = document.getElementById('food-impact-bar');
    const energyBar = document.getElementById('energy-impact-bar');
    
    // Get the value elements
    const transportValue = document.getElementById('transport-impact-value');
    const foodValue = document.getElementById('food-impact-value');
    const energyValue = document.getElementById('energy-impact-value');
    const totalValue = document.getElementById('total-impact-value');
    
    // Calculate total (excluding energy which is in kWh)
    const totalCarbon = transport + food;
    
    // Find the maximum value for scaling the bars (minimum 1 to avoid division by zero)
    const maxValue = Math.max(transport, food, energy, 1);
    
    // Update the bars (as percentage of max value)
    if (transportBar) transportBar.style.width = `${(transport / maxValue) * 100}%`;
    if (foodBar) foodBar.style.width = `${(food / maxValue) * 100}%`;
    if (energyBar) energyBar.style.width = `${(energy / maxValue) * 100}%`;
    
    // Update the values
    if (transportValue) transportValue.textContent = `${transport.toFixed(2)} kg`;
    if (foodValue) foodValue.textContent = `${food.toFixed(2)} kg`;
    if (energyValue) energyValue.textContent = `${energy.toFixed(2)} kWh`;
    if (totalValue) totalValue.textContent = `${totalCarbon.toFixed(2)} kg`;
}
/**
 * Update the CO2 chart with the latest data
 */
function updateCO2Chart() {
    console.log('Updating CO2 impact visualization...');
    
    // Calculate totals for each category
    const monthlyTotals = getMonthlyTotals();
    const transportTotal = monthlyTotals.transport;
    const foodTotal = monthlyTotals.food;
    const energyTotal = monthlyTotals.energy;
    
    console.log('Monthly totals for visualization:', { transport: transportTotal, food: foodTotal, energy: energyTotal });
    
    // Update the impact bars
    updateImpactBars(transportTotal, foodTotal, energyTotal);
}
// This section has been replaced with the impact bar visualization
    
    // This section has been replaced with the impact bar visualization

/**
 * Update dynamic inputs based on selected category
 * @param {string} category - The selected category
 */
function updateDynamicInputs(category) {
    const dynamicInputs = document.getElementById('dynamic-inputs');
    if (!dynamicInputs) return;
    
    // Clear existing inputs
    dynamicInputs.innerHTML = '';
    
    // Add category-specific inputs
    switch (category) {
        case 'transport':
            dynamicInputs.innerHTML = `
                <div class="form-group">
                    <label><i class="fas fa-info-circle"></i> Select your transport type and enter distance</label>
                </div>
            `;
            break;
        case 'food':
            dynamicInputs.innerHTML = `
                <div class="form-group">
                    <label><i class="fas fa-info-circle"></i> Select food items and enter quantities</label>
                </div>
            `;
            break;
        case 'energy':
            dynamicInputs.innerHTML = `
                <div class="form-group">
                    <label><i class="fas fa-info-circle"></i> Select energy sources and enter consumption</label>
                </div>
            `;
            break;
    }
}

// Add message handling to the modal pages
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're in an iframe (modal page)
    if (window.self !== window.top) {
        // We're in an iframe, add event listeners for form submissions
        const transportForm = document.getElementById('transportForm');
        const foodForm = document.getElementById('foodForm');
        const energyForm = document.getElementById('energyForm');
        
        if (transportForm) {
            transportForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const distance = parseFloat(document.getElementById('distance').value);
                const selectedTransportItem = window.selectedTransportItem;
                
                if (selectedTransportItem && distance) {
                    const carbonEmission = selectedTransportItem.factor * distance;
                    
                    // Send the result to the parent window
                    window.parent.postMessage({
                        type: 'carbonCalculation',
                        category: 'transport',
                        value: carbonEmission
                    }, '*');
                }
            });
        }
        
        if (foodForm) {
            foodForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const quantity = parseFloat(document.getElementById('quantity').value);
                const selectedFoodItem = window.selectedFoodItem;
                
                if (selectedFoodItem && quantity) {
                    const carbonEmission = selectedFoodItem.factor * quantity;
                    
                    // Send the result to the parent window
                    window.parent.postMessage({
                        type: 'carbonCalculation',
                        category: 'food',
                        value: carbonEmission
                    }, '*');
                }
            });
        }
        
        if (energyForm) {
            energyForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const consumption = parseFloat(document.getElementById('consumption').value);
                const selectedEnergyItem = window.selectedEnergyItem;
                
                if (selectedEnergyItem && consumption) {
                    const carbonEmission = selectedEnergyItem.factor * consumption;
                    
                    // Send the result to the parent window
                    window.parent.postMessage({
                        type: 'carbonCalculation',
                        category: 'energy',
                        value: carbonEmission
                    }, '*');
                }
            });
        }
    }
});