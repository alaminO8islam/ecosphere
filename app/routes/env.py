from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
import requests
import os
from app.models import log_user_activity

bp = Blueprint('env', __name__, url_prefix='/api/environment')

# Get OpenWeather API key from environment variables
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY')

@bp.route('/weather', methods=['GET'])
@login_required
def get_weather():
    # Get location parameters from request
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({'error': 'Latitude and longitude are required'}), 400
    
    # Call OpenWeather API
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url)
        data = response.json()
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch weather data', 'details': data}), response.status_code
        
        # Extract relevant weather information
        weather_info = {
            'temperature': data['main']['temp'],
            'humidity': data['main']['humidity'],
            'description': data['weather'][0]['description'],
            'icon': data['weather'][0]['icon'],
            'city': data['name'],
            'country': data['sys']['country']
        }
        
        # Log this activity
        log_user_activity(current_user.id, 'weather_check')
        
        return jsonify(weather_info)
    
    except Exception as e:
        return jsonify({'error': 'Failed to fetch weather data', 'details': str(e)}), 500

@bp.route('/air-quality', methods=['GET'])
@login_required
def get_air_quality():
    # Get location parameters from request
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({'error': 'Latitude and longitude are required'}), 400
    
    # Call OpenWeather Air Pollution API
    try:
        url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch air quality data', 'details': data}), response.status_code
        
        # Extract air quality information
        air_quality = {
            'aqi': data['list'][0]['main']['aqi'],  # Air Quality Index
            'components': data['list'][0]['components']  # Pollutant concentrations
        }
        
        # Map AQI to descriptive text
        aqi_descriptions = {
            1: 'Good',
            2: 'Fair',
            3: 'Moderate',
            4: 'Poor',
            5: 'Very Poor'
        }
        
        air_quality['description'] = aqi_descriptions.get(air_quality['aqi'], 'Unknown')
        
        # Log this activity
        log_user_activity(current_user.id, 'air_quality_check')
        
        return jsonify(air_quality)
    
    except Exception as e:
        return jsonify({'error': 'Failed to fetch air quality data', 'details': str(e)}), 500