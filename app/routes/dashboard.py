from flask import Blueprint, render_template, session, redirect, url_for
from app.models import User
from app.routes import carbon, vitamin, notifications
from flask import jsonify
import requests
from config import OPENWEATHER_API_KEY

bp = Blueprint('dashboard', __name__)

@bp.route('/dashboard')
def dashboard():
    user_id = session.get('user_id')
    guest = session.get('guest', False)

    if user_id:
        user = User.query.get(user_id)
        if user:
            return render_template('dashboard.html', username=user.name, is_guest=guest)

    return redirect(url_for('main.index'))

@bp.route('/api/environmental-data')
def environmental_data():
    try:
        # New York City coordinates as default
        lat = 40.7128
        lon = -74.0060
        
        onecall_url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly,daily,alerts&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(onecall_url)
        data = response.json()
        
        if "current" not in data:
            return jsonify({"error": "Could not fetch weather data"}), 500
        
        return jsonify({
            "temperature": data["current"]["temp"],
            "humidity": data["current"]["humidity"],
            "pressure": data["current"]["pressure"],
            "uvi": data["current"]["uvi"],
            "visibility": data["current"].get("visibility", 0) / 1000,  # convert to km
            "wind_speed": data["current"]["wind_speed"],
            "weather": data["current"]["weather"][0]["main"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500