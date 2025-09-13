from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from app.models import VitaminLog, VitaminDRecord, VitaminDHistory, log_user_activity
from app import db
import requests
import os
from datetime import datetime
from config import OPENWEATHER_API_KEY, OPENUV_API_KEY, OPENUV_API_KEY_BACKUP1, OPENUV_API_KEY_BACKUP2

bp = Blueprint('vitamin', __name__, url_prefix='/vitamin')

@bp.route('/')
@login_required
def index():
    return render_template('vitamin.html')

@bp.route('/api/check', methods=['POST'])
def check_vitamin_d():
    data = request.get_json()
    
    if not data or not all(k in data for k in ['latitude', 'longitude']):
        return jsonify({'error': 'Missing location data'}), 400
    
    latitude = data['latitude']
    longitude = data['longitude']
    
    # Try to get UV data from OpenUV API first
    try:
        uv_data = get_openuv_data(latitude, longitude)
        if uv_data:
            # Extract relevant data
            uv_index = uv_data.get('uv', 0)
            
            # Get weather data for temperature and humidity
            try:
                weather_response = requests.get(
                    f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={OPENWEATHER_API_KEY}&units=metric"
                )
                weather_data = weather_response.json()
                temp = weather_data.get('main', {}).get('temp', 0)
                humidity = weather_data.get('main', {}).get('humidity', 0)
                city = weather_data.get('name', 'Unknown')
                country = weather_data.get('sys', {}).get('country', 'Unknown')
            except Exception:
                # If weather API fails, use defaults
                temp = 0
                humidity = 0
                city = 'Unknown'
                country = 'Unknown'
            
            # Determine vitamin D status based on UV index
            status = 'low'
            if uv_index >= 3 and uv_index < 6:
                status = 'moderate'
            elif uv_index >= 6 and uv_index < 8:
                status = 'high'
            elif uv_index >= 8:
                status = 'very high'
            
            # Get recommendation based on status and UV index
            recommendation = get_recommendation(status, uv_index)
            
            # Save record
            user_id = current_user.id if not current_user.is_anonymous else None
            
            record = VitaminDRecord(
                user_id=user_id,
                latitude=latitude,
                longitude=longitude,
                uv_index=uv_index,
                status=status
            )
            
            db.session.add(record)
            
            # Also log to vitamin_log table
            if user_id:
                log = VitaminLog(
                    user_id=user_id,
                    city=city,
                    country=country,
                    temp=temp,
                    humidity=humidity,
                    uvi=uv_index
                )
                db.session.add(log)
                
                # Log this activity for user progress
                log_user_activity(user_id, 'vitamin_check')
            
            db.session.commit()
            
            return jsonify({
                'uv_index': uv_index,
                'status': status,
                'recommendation': recommendation,
                'temperature': temp,
                'humidity': humidity
            })
    except Exception as e:
        print(f"OpenUV API error: {str(e)}")
        # Fall back to OpenWeather API if OpenUV fails
        pass
    
    # Fallback to OpenWeather API
    try:
        response = requests.get(
            f"https://api.openweathermap.org/data/2.5/onecall?lat={latitude}&lon={longitude}&exclude=minutely,hourly,daily,alerts&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        response.raise_for_status()
        weather_data = response.json()
        
        # Extract relevant data
        uv_index = weather_data.get('current', {}).get('uvi', 0)
        temp = weather_data.get('current', {}).get('temp', 0)
        humidity = weather_data.get('current', {}).get('humidity', 0)
        
        # Determine vitamin D status based on UV index
        status = 'low'
        if uv_index >= 3 and uv_index < 6:
            status = 'moderate'
        elif uv_index >= 6 and uv_index < 8:
            status = 'high'
        elif uv_index >= 8:
            status = 'very high'
        
        # Get recommendation based on status and UV index
        recommendation = get_recommendation(status, uv_index)
        
        # Save record
        user_id = current_user.id if not current_user.is_anonymous else None
        
        record = VitaminDRecord(
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            uv_index=uv_index,
            status=status
        )
        
        db.session.add(record)
        
        # Also log to vitamin_log table
        if user_id:
            log = VitaminLog(
                user_id=user_id,
                city=weather_data.get('name', 'Unknown'),
                country=weather_data.get('sys', {}).get('country', 'Unknown'),
                temp=temp,
                humidity=humidity,
                uvi=uv_index
            )
            db.session.add(log)
            
            # Log this activity for user progress
            log_user_activity(user_id, 'vitamin_check')
        
        db.session.commit()
        
        return jsonify({
            'uv_index': uv_index,
            'status': status,
            'recommendation': recommendation,
            'temperature': temp,
            'humidity': humidity
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Function to get UV data from OpenUV API with fallback mechanism
def get_openuv_data(latitude, longitude):
    # Try with primary API key
    try:
        url = f"https://api.openuv.io/api/v1/uv?lat={latitude}&lng={longitude}"
        headers = {
            'x-access-token': OPENUV_API_KEY
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        return data.get('result', {})
    except Exception as e:
        print(f"Primary OpenUV API error: {str(e)}")
        # Try with first backup API key
        try:
            headers = {
                'x-access-token': OPENUV_API_KEY_BACKUP1
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            return data.get('result', {})
        except Exception as e:
            print(f"First backup OpenUV API error: {str(e)}")
            # Try with second backup API key
            try:
                headers = {
                    'x-access-token': OPENUV_API_KEY_BACKUP2
                }
                
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                return data.get('result', {})
            except Exception as e:
                print(f"Second backup OpenUV API error: {str(e)}")
                return None

def get_recommendation(status, uv_index):
    if status == 'low':
        return "Low UV levels. You may need longer exposure (15-30 minutes) to get adequate vitamin D."
    elif status == 'moderate':
        return "Moderate UV levels. 10-15 minutes of sun exposure should be sufficient for vitamin D production."
    elif status == 'high':
        return "High UV levels. 5-10 minutes of sun exposure is enough. Use sunscreen after that."
    else:  # very high
        return "Very high UV levels. Minimal sun exposure needed for vitamin D. Use sun protection."

@bp.route('/api/sun-data')
def get_sun_data():
    try:
        # Get latitude and longitude from request parameters
        latitude = request.args.get('lat', type=float)
        longitude = request.args.get('lon', type=float)
        
        if not latitude or not longitude:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        # Try to get data from OpenUV API
        openuv_data = get_openuv_data(latitude, longitude)
        
        if openuv_data:
            # Extract sunrise and sunset times
            sun_info = openuv_data.get('sun_info', {})
            sunrise = sun_info.get('sun_times', {}).get('sunrise')
            sunset = sun_info.get('sun_times', {}).get('sunset')
            
            return jsonify({
                'sunrise': sunrise,
                'sunset': sunset
            })
        
        # Fallback to OpenWeather API if OpenUV fails
        response = requests.get(
            f"https://api.openweathermap.org/data/2.5/onecall?lat={latitude}&lon={longitude}&exclude=minutely,hourly,alerts&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        response.raise_for_status()
        weather_data = response.json()
        
        # Extract sunrise and sunset times from OpenWeather API
        sunrise = weather_data.get('current', {}).get('sunrise')
        sunset = weather_data.get('current', {}).get('sunset')
        
        if sunrise:
            sunrise = datetime.fromtimestamp(sunrise).isoformat()
        if sunset:
            sunset = datetime.fromtimestamp(sunset).isoformat()
        
        return jsonify({
            'sunrise': sunrise,
            'sunset': sunset
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/history')
@login_required
def get_vitamin_history():
    records = VitaminDRecord.query.filter_by(user_id=current_user.id).order_by(VitaminDRecord.timestamp.desc()).limit(10).all()
    
    result = []
    for record in records:
        result.append({
            'id': record.id,
            'uv_index': record.uv_index,
            'status': record.status,
            'timestamp': record.timestamp.isoformat()
        })
    
    return jsonify(result)

@bp.route('/api/vitamin-d-history', methods=['GET'])
@login_required
def get_vitamin_d_history():
    history = VitaminDHistory.query.filter_by(user_id=current_user.id).order_by(VitaminDHistory.timestamp.desc()).limit(10).all()
    
    result = []
    for record in history:
        result.append({
            'id': record.id,
            'gender': record.gender,
            'serum_level': record.serum_level,
            'skin_type': record.skin_type,
            'age_group': record.age_group,
            'exposure_time': record.exposure_time,
            'vitamin_d_amount': record.vitamin_d_amount,
            'timestamp': record.timestamp.isoformat()
        })
    
    return jsonify(result)

@bp.route('/api/vitamin-d-history', methods=['POST'])
@login_required
def save_vitamin_d_history():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Create new history record
    new_record = VitaminDHistory(
        user_id=current_user.id,
        gender=data.get('gender'),
        serum_level=data.get('serum_level'),
        skin_type=data.get('skin_type'),
        age_group=data.get('age_group'),
        exposure_time=data.get('exposure_time'),
        vitamin_d_amount=data.get('vitamin_d_amount')
    )
    
    db.session.add(new_record)
    db.session.commit()
    
    # Log this activity for user progress
    log_user_activity(current_user.id, 'vitamin_d_check')
    
    return jsonify({
        'message': 'Vitamin D history saved successfully',
        'id': new_record.id
    }), 201