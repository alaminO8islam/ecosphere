from flask import Blueprint, render_template, jsonify, request, make_response
from flask_login import login_required, current_user
from app.models import DashboardData, User, WeatherAnalytics, AirQualityAnalytics
from app import db
import requests
import os
import random
import math
from config import OPENWEATHER_API_KEY
from datetime import datetime, timedelta, date, time

bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@bp.route('/')
@login_required
def index():
    return render_template('dashboard.html')

# Article view is now integrated into the dashboard.html page

@bp.route('/api/data')
@login_required
def get_dashboard_data():
    # Get the latest dashboard data for the current user
    data = DashboardData.query.filter_by(user_id=current_user.id).order_by(DashboardData.recorded_at.desc()).first()
    
    if data:
        return jsonify({
            'temperature': data.temperature,
            'humidity': data.humidity,
            'light': data.light,
            'ph': data.ph,
            'recorded_at': data.recorded_at.isoformat()
        })
    else:
        return jsonify({
            'message': 'No dashboard data available'
        }), 404

@bp.route('/api/analytics/temperature')
@login_required
def get_temperature_analytics():
    # Get the timeframe from query parameters (day, week, month)
    timeframe = request.args.get('timeframe', 'day')
    
    # Calculate the date range based on the timeframe
    today = date.today()
    if timeframe == 'day':
        start_date = today
    elif timeframe == 'week':
        start_date = today - timedelta(days=7)
    elif timeframe == 'month':
        start_date = today - timedelta(days=30)
    else:
        return jsonify({'error': 'Invalid timeframe'}), 400
    
    # Check if we have any analytics data for this user
    has_data = WeatherAnalytics.query.filter_by(user_id=current_user.id).first() is not None
    
    # If no data exists, create some sample data for testing
    if not has_data:
        create_sample_weather_analytics(current_user.id, start_date, today)
        
    # Query the database for temperature data within the date range
    analytics_data = WeatherAnalytics.query.filter(
        WeatherAnalytics.user_id == current_user.id,
        WeatherAnalytics.date >= start_date,
        WeatherAnalytics.date <= today
    ).order_by(WeatherAnalytics.date, WeatherAnalytics.time).all()
    
    # Calculate average temperature for each day
    daily_data = {}
    for data in analytics_data:
        day_str = data.date.strftime('%Y-%m-%d')
        if day_str not in daily_data:
            daily_data[day_str] = {
                'temperature_values': [],
                'date': day_str
            }
        daily_data[day_str]['temperature_values'].append(data.temperature)
    
    # Find the highest temperature for each day
    result = []
    for day, data in daily_data.items():
        if data['temperature_values']:
            max_temperature = max(data['temperature_values'])
            result.append({
                'date': data['date'],
                'temperature': max_temperature
            })
    
    # Calculate trend compared to previous period
    trend = 0
    if result:
        # Get previous period data for comparison
        prev_start_date = start_date - timedelta(days=(today - start_date).days)
        prev_end_date = start_date - timedelta(days=1)
        
        prev_analytics_data = WeatherAnalytics.query.filter(
            WeatherAnalytics.user_id == current_user.id,
            WeatherAnalytics.date >= prev_start_date,
            WeatherAnalytics.date <= prev_end_date
        ).all()
        
        # Calculate average temperature for previous period
        current_avg = sum([r['temperature'] for r in result]) / len(result) if result else 0
        prev_avg = sum([data.temperature for data in prev_analytics_data]) / len(prev_analytics_data) if prev_analytics_data else 0
        
        # Calculate trend percentage
        if prev_avg > 0:
            trend = ((current_avg - prev_avg) / prev_avg) * 100
    
    return jsonify({
        'daily_data': result,
        'trend': trend
    })
    
    # Query the database for temperature data within the date range
    analytics_data = WeatherAnalytics.query.filter(
        WeatherAnalytics.user_id == current_user.id,
        WeatherAnalytics.date >= start_date,
        WeatherAnalytics.date <= today
    ).order_by(WeatherAnalytics.date, WeatherAnalytics.time).all()
    
    # Calculate average temperature for each day
    daily_data = {}
    for data in analytics_data:
        day_str = data.date.strftime('%Y-%m-%d')
        if day_str not in daily_data:
            daily_data[day_str] = {
                'temperatures': [],
                'date': day_str
            }
        daily_data[day_str]['temperatures'].append(data.temperature)
    
    # Find the highest temperature for each day
    result = []
    for day, data in daily_data.items():
        if data['temperatures']:
            max_temp = max(data['temperatures'])
            result.append({
                'date': data['date'],
                'temperature': max_temp
            })
    
    # Calculate the overall average temperature
    all_temps = [data.temperature for data in analytics_data]
    avg_temperature = sum(all_temps) / len(all_temps) if all_temps else 0
    
    # Calculate the trend (comparison with previous period)
    prev_start_date = start_date - timedelta(days=(today - start_date).days)
    prev_analytics_data = WeatherAnalytics.query.filter(
        WeatherAnalytics.user_id == current_user.id,
        WeatherAnalytics.date >= prev_start_date,
        WeatherAnalytics.date < start_date
    ).all()
    
    prev_temps = [data.temperature for data in prev_analytics_data]
    prev_avg_temperature = sum(prev_temps) / len(prev_temps) if prev_temps else 0
    
    temperature_change = avg_temperature - prev_avg_temperature
    trend = 'up' if temperature_change > 0 else 'down' if temperature_change < 0 else 'stable'
    
    # Format data for chart display
    labels = []
    values = []
    for item in sorted(result, key=lambda x: x['date']):
        labels.append(item['date'])
        values.append(item['temperature'])
    
    return jsonify({
        'average_temperature': round(avg_temperature, 1),
        'temperature_change': round(temperature_change, 1),
        'trend': trend,
        'labels': labels,
        'values': values
    })

# Helper function to create sample weather analytics data
def create_sample_weather_analytics(user_id, start_date, end_date):
    # Generate sample data for each day in the range
    current_date = start_date
    while current_date <= end_date:
        # Create 4 entries per day (morning, noon, evening, night)
        for hour in [8, 12, 18, 22]:
            # Generate random but realistic temperature and humidity values
            temperature = 20 + 5 * (hour / 24) + (5 * (current_date.day % 3 - 1))  # 15-30°C range with daily pattern
            humidity = 50 + 20 * (1 - hour / 24) + (10 * (current_date.day % 3 - 1))  # 40-80% range with daily pattern
            
            # Create a sample entry
            sample_data = WeatherAnalytics(
                user_id=user_id,
                temperature=round(temperature, 1),
                humidity=round(humidity, 1),
                date=current_date,
                time=time(hour, 0, 0)
            )
            db.session.add(sample_data)
        
        # Move to next day
        current_date += timedelta(days=1)
    
    # Commit all sample data
    try:
        db.session.commit()
        print(f"Created sample weather analytics data for user {user_id}")
    except Exception as e:
        db.session.rollback()
        print(f"Error creating sample data: {e}")


@bp.route('/api/analytics/metrics')
@login_required
def get_analytics_metrics():
    """Get current metrics for analytics cards"""
    # Get the latest data from the database
    latest_weather = WeatherAnalytics.query.filter_by(user_id=current_user.id).order_by(WeatherAnalytics.date.desc(), WeatherAnalytics.time.desc()).first()
    latest_dashboard = DashboardData.query.filter_by(user_id=current_user.id).order_by(DashboardData.recorded_at.desc()).first()
    
    # Calculate changes compared to previous day
    yesterday = datetime.now().date() - timedelta(days=1)
    yesterday_weather = WeatherAnalytics.query.filter(
        WeatherAnalytics.user_id == current_user.id,
        WeatherAnalytics.date == yesterday
    ).order_by(WeatherAnalytics.time.desc()).first()
    
    # Default values if no data exists
    temperature = 24.2
    humidity = 67
    light_hours = 14
    water_changes = 3
    
    temperature_change = 0.5
    humidity_change = -2.0
    light_hours_change = 1.0
    water_changes_change = 1
    
    # Update with real data if available
    if latest_weather:
        temperature = latest_weather.temperature
        humidity = latest_weather.humidity
        
        if yesterday_weather:
            temperature_change = round(temperature - yesterday_weather.temperature, 1)
            humidity_change = round(humidity - yesterday_weather.humidity, 1)
    
    if latest_dashboard:
        # Check if the dashboard data model has light_hours and water_changes fields
        if hasattr(latest_dashboard, 'light_hours'):
            light_hours = latest_dashboard.light_hours
        elif hasattr(latest_dashboard, 'light'):
            light_hours = latest_dashboard.light
            
        if hasattr(latest_dashboard, 'water_changes'):
            water_changes = latest_dashboard.water_changes
    
    return jsonify({
        'temperature': temperature,
        'humidity': humidity,
        'light_hours': light_hours,
        'water_changes': water_changes,
        'temperature_change': temperature_change,
        'humidity_change': humidity_change,
        'light_hours_change': light_hours_change,
        'water_changes_change': water_changes_change
    })


# Helper function to calculate Air Quality Index (AQI) from PM2.5 and PM10 values
def calculate_aqi(pm2_5, pm10):
    """Calculate Air Quality Index from PM2.5 and PM10 values"""
    # Simplified AQI calculation
    aqi = (pm2_5 / 10) + (pm10 / 20)
    return round(aqi, 2)

@bp.route('/api/analytics/air-quality')
@login_required
def get_air_quality_data():
    """Get air quality data for charts"""
    timeframe = request.args.get('timeframe', 'day')
    
    # Determine date range based on timeframe
    today = datetime.now().date()
    if timeframe == 'day':
        start_date = today
    elif timeframe == 'week':
        start_date = today - timedelta(days=6)
    elif timeframe == 'month':
        start_date = today - timedelta(days=29)
    else:
        start_date = today
    
    # Query the database for air quality data
    air_quality_data = AirQualityAnalytics.query.filter(
        AirQualityAnalytics.user_id == current_user.id,
        AirQualityAnalytics.date >= start_date,
        AirQualityAnalytics.date <= today
    ).order_by(AirQualityAnalytics.date, AirQualityAnalytics.time).all()
    
    # If no data exists, create sample data
    if not air_quality_data:
        create_sample_air_quality_data(current_user.id, start_date, today)
        air_quality_data = AirQualityAnalytics.query.filter(
            AirQualityAnalytics.user_id == current_user.id,
            AirQualityAnalytics.date >= start_date,
            AirQualityAnalytics.date <= today
        ).order_by(AirQualityAnalytics.date, AirQualityAnalytics.time).all()
    
    # Format data for chart display
    labels = []
    values = []
    
    for data in air_quality_data:
        date_str = data.date.strftime('%Y-%m-%d')
        time_str = data.time.strftime('%H:%M')
        labels.append(f"{date_str}T{time_str}")
        
        # Calculate air quality index
        aqi = calculate_aqi(data.pm2_5, data.pm10)
        values.append(aqi)
    
    return jsonify({
        'labels': labels,
        'values': values
    })


@bp.route('/api/analytics/export')
@login_required
def export_analytics_data():
    """Export analytics data in various formats"""
    format_type = request.args.get('format', 'json')
    
    # Get all analytics data for the user
    weather_data = WeatherAnalytics.query.filter_by(user_id=current_user.id).order_by(WeatherAnalytics.date, WeatherAnalytics.time).all()
    air_quality_data = AirQualityAnalytics.query.filter_by(user_id=current_user.id).order_by(AirQualityAnalytics.date, AirQualityAnalytics.time).all()
    dashboard_data = DashboardData.query.filter_by(user_id=current_user.id).order_by(DashboardData.recorded_at).all()
    
    # Format data for export
    export_data = {
        'weather': [{
            'date': data.date.strftime('%Y-%m-%d'),
            'time': data.time.strftime('%H:%M'),
            'temperature': data.temperature,
            'humidity': data.humidity
        } for data in weather_data],
        'air_quality': [{
            'date': data.date.strftime('%Y-%m-%d'),
            'time': data.time.strftime('%H:%M'),
            'pm2_5': data.pm2_5,
            'pm10': data.pm10
        } for data in air_quality_data],
        'dashboard': [{
            'date': data.recorded_at.strftime('%Y-%m-%d %H:%M:%S'),
            'temperature': data.temperature,
            'humidity': data.humidity,
            'light': data.light,
            'ph': data.ph
        } for data in dashboard_data]
    }
    
    if format_type == 'json':
        return jsonify(export_data)
    elif format_type == 'csv':
        # Create CSV content
        csv_content = "data_type,date,time,value1,value2,value3,value4\n"
        
        # Add weather data
        for item in export_data['weather']:
            csv_content += f"weather,{item['date']},{item['time']},{item['temperature']},{item['humidity']},,\n"
        
        # Add air quality data
        for item in export_data['air_quality']:
            csv_content += f"air_quality,{item['date']},{item['time']},{item['pm2_5']},{item['pm10']},,\n"
        
        # Add dashboard data
        for item in export_data['dashboard']:
            csv_content += f"dashboard,{item['date']},,{item['temperature']},{item['humidity']},{item['light']},{item['ph']}\n"
        
        response = make_response(csv_content)
        response.headers["Content-Disposition"] = f"attachment; filename=ecosphere_analytics_{datetime.now().strftime('%Y-%m-%d')}.csv"
        response.headers["Content-Type"] = "text/csv"
        return response
    else:
        return jsonify({'error': 'Unsupported export format'}), 400

# Helper function to create sample air quality data
def create_sample_air_quality_data(user_id, start_date, end_date):
    # Generate sample data for each day in the range
    current_date = start_date
    while current_date <= end_date:
        # Create 4 entries per day (morning, noon, evening, night)
        for hour in [8, 12, 18, 22]:
            # Generate random but realistic PM2.5 and PM10 values
            pm2_5 = 15 + 5 * math.sin(hour / 24 * math.pi) + (random.random() * 5 - 2.5)
            pm10 = 30 + 10 * math.sin(hour / 24 * math.pi) + (random.random() * 10 - 5)
            
            # Create a sample entry
            sample_data = AirQualityAnalytics(
                user_id=user_id,
                pm2_5=round(max(0, pm2_5), 1),
                pm10=round(max(0, pm10), 1),
                date=current_date,
                time=time(hour, 0, 0)
            )
            db.session.add(sample_data)
        
        # Move to next day
        current_date += timedelta(days=1)
    
    # Commit all sample data
    try:
        db.session.commit()
        print(f"Created sample air quality data for user {user_id}")
    except Exception as e:
        db.session.rollback()
        print(f"Error creating sample air quality data: {e}")


@bp.route('/api/analytics/environmental-trends')
@login_required
def get_environmental_trends():
    """Get environmental trends data for the chart"""
    # Get the last 30 days of data
    today = datetime.now().date()
    start_date = today - timedelta(days=30)
    
    # Get weather data for carbon footprint approximation
    weather_data = WeatherAnalytics.query.filter(
        WeatherAnalytics.user_id == current_user.id,
        WeatherAnalytics.date >= start_date
    ).order_by(WeatherAnalytics.date).all()
    
    # If no data exists, create sample data
    if not weather_data:
        create_sample_weather_analytics(current_user.id, start_date, today)
        weather_data = WeatherAnalytics.query.filter(
            WeatherAnalytics.user_id == current_user.id,
            WeatherAnalytics.date >= start_date
        ).order_by(WeatherAnalytics.date).all()
    
    # Group data by date
    daily_data = {}
    for data in weather_data:
        day_str = data.date.strftime('%Y-%m-%d')
        if day_str not in daily_data:
            daily_data[day_str] = {
                'temperatures': [],
                'humidity': [],
                'date': day_str
            }
        daily_data[day_str]['temperatures'].append(data.temperature)
        daily_data[day_str]['humidity'].append(data.humidity)
    
    # Calculate daily averages and simulate carbon footprint and energy usage
    dates = []
    carbon_values = []
    energy_values = []
    
    # Start with higher values and gradually decrease (simulating improvement)
    base_carbon = 150
    base_energy = 200
    day_count = 0
    
    for day, data in sorted(daily_data.items()):
        if data['temperatures'] and data['humidity']:
            avg_temp = sum(data['temperatures']) / len(data['temperatures'])
            avg_humidity = sum(data['humidity']) / len(data['humidity'])
            
            # Simulate carbon footprint based on temperature and humidity
            # Higher temperature and humidity generally mean more energy usage
            carbon = base_carbon - (day_count * 0.8) + ((avg_temp - 20) * 0.5) + ((avg_humidity - 50) * 0.1)
            energy = base_energy - (day_count * 0.7) + ((avg_temp - 20) * 0.7) + ((avg_humidity - 50) * 0.2)
            
            # Add some randomness
            carbon += (random.random() * 10 - 5)
            energy += (random.random() * 15 - 7.5)
            
            dates.append(day)
            carbon_values.append(round(max(0, carbon), 1))
            energy_values.append(round(max(0, energy), 1))
            
            day_count += 1
    
    return jsonify({
        'dates': dates,
        'carbon_values': carbon_values,
        'energy_values': energy_values
    })


@bp.route('/api/analytics/humidity')
@login_required
def get_humidity_analytics():
    # Get the timeframe from query parameters (day, week, month)
    timeframe = request.args.get('timeframe', 'day')
    
    # Calculate the date range based on the timeframe
    today = date.today()
    if timeframe == 'day':
        start_date = today
    elif timeframe == 'week':
        start_date = today - timedelta(days=7)
    elif timeframe == 'month':
        start_date = today - timedelta(days=30)
    else:
        return jsonify({'error': 'Invalid timeframe'}), 400
    
    # Check if we have any analytics data for this user
    has_data = WeatherAnalytics.query.filter_by(user_id=current_user.id).first() is not None
    
    # If no data exists, create some sample data for testing
    if not has_data:
        create_sample_weather_analytics(current_user.id, start_date, today)
        
    # Query the database for humidity data within the date range
    analytics_data = WeatherAnalytics.query.filter(
        WeatherAnalytics.user_id == current_user.id,
        WeatherAnalytics.date >= start_date,
        WeatherAnalytics.date <= today
    ).order_by(WeatherAnalytics.date, WeatherAnalytics.time).all()
    
    # Calculate average humidity for each day
    daily_data = {}
    for data in analytics_data:
        day_str = data.date.strftime('%Y-%m-%d')
        if day_str not in daily_data:
            daily_data[day_str] = {
                'humidity_values': [],
                'date': day_str
            }
        daily_data[day_str]['humidity_values'].append(data.humidity)
    
    # Find the highest humidity for each day
    result = []
    for day, data in daily_data.items():
        if data['humidity_values']:
            max_humidity = max(data['humidity_values'])
            result.append({
                'date': data['date'],
                'humidity': max_humidity
            })
    
    # Calculate trend compared to previous period
    trend = 0
    if result:
        # Get previous period data for comparison
        prev_start_date = start_date - timedelta(days=(today - start_date).days)
        prev_end_date = start_date - timedelta(days=1)
        
        prev_analytics_data = WeatherAnalytics.query.filter(
            WeatherAnalytics.user_id == current_user.id,
            WeatherAnalytics.date >= prev_start_date,
            WeatherAnalytics.date <= prev_end_date
        ).all()
        
        # Calculate average humidity for previous period
        current_avg = sum([r['humidity'] for r in result]) / len(result) if result else 0
        prev_avg = sum([data.humidity for data in prev_analytics_data]) / len(prev_analytics_data) if prev_analytics_data else 0
        
        # Calculate trend percentage
        if prev_avg > 0:
            trend = ((current_avg - prev_avg) / prev_avg) * 100
    
    return jsonify({
        'daily_data': result,
        'trend': trend
    })

# Helper function to create sample air quality analytics data
def create_sample_air_quality_analytics(user_id, start_date, end_date):
    # Generate sample data for each day in the range
    current_date = start_date
    while current_date <= end_date:
        # Create 4 entries per day (morning, noon, evening, night)
        for hour in [8, 12, 18, 22]:
            # Generate random but realistic PM2.5 and PM10 values
            pm2_5 = 10 + 5 * (hour / 24) + (5 * (current_date.day % 3 - 1))  # 5-20 μg/m³ range with daily pattern
            pm10 = 20 + 10 * (hour / 24) + (10 * (current_date.day % 3 - 1))  # 10-40 μg/m³ range with daily pattern
            
            # Create a sample entry
            sample_data = AirQualityAnalytics(
                user_id=user_id,
                pm2_5=round(pm2_5, 1),
                pm10=round(pm10, 1),
                date=current_date,
                time=time(hour, 0, 0)
            )
            db.session.add(sample_data)
        
        # Move to next day
        current_date += timedelta(days=1)
    
    # Commit all sample data
    try:
        db.session.commit()
        print(f"Created sample air quality analytics data for user {user_id}")
    except Exception as e:
        db.session.rollback()
        print(f"Error creating sample air quality data: {e}")

@bp.route('/api/analytics/air-quality')
@login_required
def get_air_quality_analytics():
    # Get the timeframe from query parameters (day, week, month)
    timeframe = request.args.get('timeframe', 'day')
    
    # Calculate the date range based on the timeframe
    today = date.today()
    if timeframe == 'day':
        start_date = today
    elif timeframe == 'week':
        start_date = today - timedelta(days=7)
    elif timeframe == 'month':
        start_date = today - timedelta(days=30)
    else:
        return jsonify({'error': 'Invalid timeframe'}), 400
    
    # Check if we have any air quality analytics data for this user
    has_data = AirQualityAnalytics.query.filter_by(user_id=current_user.id).first() is not None
    
    # If no data exists, create some sample data for testing
    if not has_data:
        create_sample_air_quality_analytics(current_user.id, start_date, today)
        
    # Query the database for air quality data within the date range
    analytics_data = AirQualityAnalytics.query.filter(
        AirQualityAnalytics.user_id == current_user.id,
        AirQualityAnalytics.date >= start_date,
        AirQualityAnalytics.date <= today
    ).order_by(AirQualityAnalytics.date, AirQualityAnalytics.time).all()
    
    # Calculate average PM2.5 and PM10 for each day
    daily_data = {}
    for data in analytics_data:
        day_str = data.date.strftime('%Y-%m-%d')
        if day_str not in daily_data:
            daily_data[day_str] = {
                'pm2_5_values': [],
                'pm10_values': [],
                'date': day_str
            }
        daily_data[day_str]['pm2_5_values'].append(data.pm2_5)
        daily_data[day_str]['pm10_values'].append(data.pm10)
    
    # Find the highest PM2.5 and PM10 for each day
    result = []
    for day, data in daily_data.items():
        if data['pm2_5_values'] and data['pm10_values']:
            max_pm2_5 = max(data['pm2_5_values'])
            max_pm10 = max(data['pm10_values'])
            result.append({
                'date': data['date'],
                'pm2_5': max_pm2_5,
                'pm10': max_pm10
            })
    
    # Calculate trend compared to previous period
    pm2_5_trend = 0
    pm10_trend = 0
    if result:
        # Get previous period data for comparison
        prev_start_date = start_date - timedelta(days=(today - start_date).days)
        prev_end_date = start_date - timedelta(days=1)
        
        prev_analytics_data = AirQualityAnalytics.query.filter(
            AirQualityAnalytics.user_id == current_user.id,
            AirQualityAnalytics.date >= prev_start_date,
            AirQualityAnalytics.date <= prev_end_date
        ).all()
        
        # Calculate average PM2.5 and PM10 for previous period
        current_pm2_5_avg = sum([r['pm2_5'] for r in result]) / len(result) if result else 0
        current_pm10_avg = sum([r['pm10'] for r in result]) / len(result) if result else 0
        
        prev_pm2_5_avg = sum([data.pm2_5 for data in prev_analytics_data]) / len(prev_analytics_data) if prev_analytics_data else 0
        prev_pm10_avg = sum([data.pm10 for data in prev_analytics_data]) / len(prev_analytics_data) if prev_analytics_data else 0
        
        # Calculate trend percentage
        if prev_pm2_5_avg > 0:
            pm2_5_trend = ((current_pm2_5_avg - prev_pm2_5_avg) / prev_pm2_5_avg) * 100
        if prev_pm10_avg > 0:
            pm10_trend = ((current_pm10_avg - prev_pm10_avg) / prev_pm10_avg) * 100
    
    # Format data for chart display
    labels = []
    values = []
    
    # Sort result by date
    sorted_result = sorted(result, key=lambda x: x['date'])
    
    for item in sorted_result:
        labels.append(item['date'])
        # Calculate AQI from PM2.5 and PM10 values
        aqi_value = calculate_aqi(item['pm2_5'], item['pm10'])
        values.append(aqi_value)
    
    return jsonify({
        'labels': labels,
        'values': values,
        'pm2_5_trend': pm2_5_trend,
        'pm10_trend': pm10_trend
    })
    
    if day_str not in daily_data:
        daily_data[day_str] = {
            'humidities': [],
            'date': day_str
        }
    daily_data[day_str]['humidities'].append(data.humidity)
    
    # Find the highest humidity for each day
    result = []
    for day, data in daily_data.items():
        if data['humidities']:
            max_humidity = max(data['humidities'])
            result.append({
                'date': data['date'],
                'humidity': max_humidity
            })
    
    # Calculate the overall average humidity
    all_humidities = [data.humidity for data in analytics_data]
    avg_humidity = sum(all_humidities) / len(all_humidities) if all_humidities else 0
    
    # Calculate the trend (comparison with previous period)
    prev_start_date = start_date - timedelta(days=(today - start_date).days)
    prev_analytics_data = WeatherAnalytics.query.filter(
        WeatherAnalytics.user_id == current_user.id,
        WeatherAnalytics.date >= prev_start_date,
        WeatherAnalytics.date < start_date
    ).all()
    
    prev_humidities = [data.humidity for data in prev_analytics_data]
    prev_avg_humidity = sum(prev_humidities) / len(prev_humidities) if prev_humidities else 0
    
    humidity_change = avg_humidity - prev_avg_humidity
    trend = 'up' if humidity_change > 0 else 'down' if humidity_change < 0 else 'stable'
    
    return jsonify({
        'average_humidity': round(avg_humidity, 1),
        'humidity_change': round(humidity_change, 1),
        'trend': trend,
        'daily_data': result
    })

@bp.route('/api/weather')
def get_weather_data():
    # Get latitude and longitude from query parameters
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({'error': 'Missing location data'}), 400
        
    # Check if user is logged in to store analytics data
    store_analytics = False
    if current_user.is_authenticated:
        store_analytics = True
    
    try:
        # Call OpenWeather API - using current weather endpoint instead of onecall (which requires subscription)
        response = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        
        if response.status_code != 200:
            # Try alternative endpoint if first one fails
            response = requests.get(
                f"https://api.weatherapi.com/v1/current.json?key={OPENWEATHER_API_KEY}&q={lat},{lon}&aqi=yes"
            )
            
            if response.status_code != 200:
                return jsonify({'error': f'Weather API error: {response.status_code}'}), 500
            
            # Parse WeatherAPI.com response
            weather_data = response.json()
            current = weather_data.get('current', {})
            temperature = current.get('temp_c')
            feels_like = current.get('feelslike_c')
            humidity = current.get('humidity')
            uv_index = current.get('uv', 0)
            # Get wind data
            wind_speed = current.get('wind_kph', 0) / 3.6  # convert to m/s
            wind_deg = current.get('wind_degree', 0)
            wind_gust = current.get('gust_kph', 0) / 3.6  # convert to m/s
            # Get clouds and rain data
            cloud_cover = current.get('cloud', 0)
            rain_1h = current.get('precip_mm', 0)
            # Get visibility
            visibility = current.get('vis_km', 0)
            condition = current.get('condition', {})
            weather_condition = condition.get('text', 'Unknown')
            weather_description = condition.get('text', 'Unknown')
        else:
            # Parse OpenWeather response
            weather_data = response.json()
            main = weather_data.get('main', {})
            temperature = main.get('temp')
            feels_like = main.get('feels_like')
            humidity = main.get('humidity')
            # UV index not available in this endpoint, use 0 as default
            uv_index = 0
            # Get wind data
            wind = weather_data.get('wind', {})
            wind_speed = wind.get('speed', 0)  # m/s
            wind_deg = wind.get('deg', 0)      # degrees
            wind_gust = wind.get('gust', 0)    # m/s
            # Get clouds and rain data
            clouds = weather_data.get('clouds', {})
            cloud_cover = clouds.get('all', 0)  # percentage
            rain = weather_data.get('rain', {})
            rain_1h = rain.get('1h', 0)  # mm in last hour
            # Get visibility
            visibility = weather_data.get('visibility', 0) / 1000  # convert from meters to km
            weather = weather_data.get('weather', [{}])[0]
            weather_condition = weather.get('main', 'Unknown')
            weather_description = weather.get('description', 'Unknown')
        
        # Save to database if user is logged in
        if not current_user.is_anonymous:
            dashboard_data = DashboardData(
                user_id=current_user.id,
                temperature=temperature,
                humidity=humidity,
                light=uv_index,  # Using UV index as a proxy for light
                ph=7.0  # Default pH value as it's not available from weather API
            )
            db.session.add(dashboard_data)
            db.session.commit()
        
        # Store analytics data if user is logged in
        if store_analytics and current_user.is_authenticated:
            try:
                # Store weather analytics data
                weather_analytics = WeatherAnalytics(
                    user_id=current_user.id,
                    temperature=temperature,
                    humidity=humidity,
                    date=date.today(),
                    time=datetime.now().time()
                )
                db.session.add(weather_analytics)
                
                # Store air quality analytics data if available
                if 'air_quality' in weather_data and weather_data['air_quality']:
                    air_quality = weather_data.get('air_quality', {})
                    air_quality_analytics = AirQualityAnalytics(
                        user_id=current_user.id,
                        pm2_5=air_quality.get('pm2_5', 0),
                        pm10=air_quality.get('pm10', 0),
                        date=date.today(),
                        time=datetime.now().time()
                    )
                    db.session.add(air_quality_analytics)
                
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error storing analytics data: {e}")
        
        # Extract additional weather data with proper fallbacks
        feels_like = main.get('feels_like') if response.status_code == 200 else current.get('feelslike_c')
        wind_speed = weather_data.get('wind', {}).get('speed', 0) if response.status_code == 200 else current.get('wind_kph', 0) / 3.6
        wind_deg = weather_data.get('wind', {}).get('deg', 0) if response.status_code == 200 else current.get('wind_degree', 0)
        wind_gust = weather_data.get('wind', {}).get('gust', wind_speed) if response.status_code == 200 else current.get('gust_kph', 0) / 3.6
        cloud_cover = weather_data.get('clouds', {}).get('all', 0) if response.status_code == 200 else current.get('cloud', 0)
        rain_1h = weather_data.get('rain', {}).get('1h', 0) if response.status_code == 200 else current.get('precip_mm', 0)
        visibility = weather_data.get('visibility', 0) / 1000 if response.status_code == 200 else current.get('vis_km', 0)
        
        return jsonify({
            'temperature': temperature,
            'feels_like': feels_like,
            'humidity': humidity,
            'uv_index': uv_index,
            'weather_condition': weather_condition,
            'weather_description': weather_description,
            'wind_speed': wind_speed,
            'wind_deg': wind_deg,
            'wind_gust': wind_gust,
            'cloud_cover': cloud_cover,
            'rain_1h': rain_1h,
            'visibility': visibility
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@bp.route('/api/sun')
def get_sun_data():
    # Get latitude and longitude from query parameters
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({'error': 'Missing location data'}), 400
    
    try:
        # Get OpenUV API keys from environment variables (primary and backups)
        api_keys = [
            os.environ.get('OPENUV_API_KEY'),
            os.environ.get('OPENUV_API_KEY_BACKUP1'),
            os.environ.get('OPENUV_API_KEY_BACKUP2')
        ]
        
        # Filter out None values
        api_keys = [key for key in api_keys if key]
        
        if not api_keys:
            return jsonify({'error': 'No OpenUV API keys configured'}), 500
        
        response = None
        last_error = None
        
        # Try each API key until one works
        for api_key in api_keys:
            try:
                headers = {
                    'x-access-token': api_key
                }
                
                response = requests.get(
                    f"https://api.openuv.io/api/v1/uv?lat={lat}&lng={lon}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    # Success! Break out of the loop
                    break
                else:
                    last_error = f'OpenUV API error with key: {response.status_code}'
            except Exception as e:
                last_error = str(e)
                continue
        
        # If we've tried all keys and none worked
        if not response or response.status_code != 200:
            return jsonify({'error': last_error or 'All OpenUV API keys failed'}), 500
        
        # Parse OpenUV response
        sun_data = response.json()
        result = sun_data.get('result', {})
        sun_info = result.get('sun_info', {})
        sun_times = sun_info.get('sun_times', {})
        
        # Format sunrise and sunset times
        sunrise = sun_times.get('sunrise')
        sunset = sun_times.get('sunset')
        
        # Get user's timezone offset from request
        timezone_offset = request.args.get('timezone_offset', '0')
        try:
            # Convert to integer (minutes)
            timezone_offset = int(timezone_offset)
        except ValueError:
            timezone_offset = 0
            
        if sunrise:
            # Parse the ISO format time and adjust for user's timezone
            sunrise_time = datetime.fromisoformat(sunrise.replace('Z', '+00:00'))
            # Apply timezone offset (converting from minutes to seconds)
            # Note: getTimezoneOffset() returns minutes WEST of UTC, so we need to subtract
            # Example: New York is UTC-5, so getTimezoneOffset() returns 300 (5 hours * 60)
            sunrise_time = sunrise_time - timedelta(minutes=timezone_offset)
            sunrise_formatted = sunrise_time.strftime('%I:%M %p')
        else:
            sunrise_formatted = 'N/A'
            
        if sunset:
            # Parse the ISO format time and adjust for user's timezone
            sunset_time = datetime.fromisoformat(sunset.replace('Z', '+00:00'))
            # Apply timezone offset (converting from minutes to seconds)
            sunset_time = sunset_time - timedelta(minutes=timezone_offset)
            sunset_formatted = sunset_time.strftime('%I:%M %p')
        else:
            sunset_formatted = 'N/A'
        
        return jsonify({
            'sunrise': sunrise_formatted,
            'sunset': sunset_formatted,
            'raw_data': sun_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    try:
        # Call OpenWeather API - using current weather endpoint instead of onecall (which requires subscription)
        response = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        
        if response.status_code != 200:
            # Try alternative endpoint if first one fails
            response = requests.get(
                f"https://api.weatherapi.com/v1/current.json?key={OPENWEATHER_API_KEY}&q={lat},{lon}&aqi=yes"
            )
            
            if response.status_code != 200:
                return jsonify({'error': f'Weather API error: {response.status_code}'}), 500
            
            # Parse WeatherAPI.com response
            weather_data = response.json()
            current = weather_data.get('current', {})
            temperature = current.get('temp_c')
            humidity = current.get('humidity')
            uv_index = current.get('uv', 0)
            condition = current.get('condition', {})
            weather_condition = condition.get('text', 'Unknown')
            weather_description = condition.get('text', 'Unknown')
        else:
            # Parse OpenWeather response
            weather_data = response.json()
            main = weather_data.get('main', {})
            temperature = main.get('temp')
            humidity = main.get('humidity')
            # UV index not available in this endpoint, use 0 as default
            uv_index = 0
            weather = weather_data.get('weather', [{}])[0]
            weather_condition = weather.get('main', 'Unknown')
            weather_description = weather.get('description', 'Unknown')
        
        # Save to database if user is logged in
        if not current_user.is_anonymous:
            dashboard_data = DashboardData(
                user_id=current_user.id,
                temperature=temperature,
                humidity=humidity,
                light=uv_index,  # Using UV index as a proxy for light
                ph=7.0  # Default pH value as it's not available from weather API
            )
            db.session.add(dashboard_data)
            db.session.commit()
        
        return jsonify({
            'temperature': temperature,
            'feels_like': feels_like,
            'humidity': humidity,
            'uv_index': uv_index,
            'weather_condition': weather_condition,
            'weather_description': weather_description,
            'wind_speed': wind_speed,
            'wind_deg': wind_deg,
            'wind_gust': wind_gust,
            'cloud_cover': cloud_cover,
            'rain_1h': rain_1h,
            'visibility': visibility
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/data', methods=['POST'])
@login_required
def add_dashboard_data():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    new_data = DashboardData(
        user_id=current_user.id,
        temperature=data.get('temperature'),
        humidity=data.get('humidity'),
        light=data.get('light'),
        ph=data.get('ph')
    )
    
    db.session.add(new_data)
    db.session.commit()
    
    return jsonify({
        'message': 'Dashboard data added successfully',
        'id': new_data.id
    }), 201
