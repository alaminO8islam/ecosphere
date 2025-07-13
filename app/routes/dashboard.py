from flask import Blueprint, jsonify, request, session
from ..models import db, DashboardData
import os
import requests
from datetime import datetime

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

# ✅ Dashboard Sensor Data APIs (Temperature, Humidity, etc.)
@bp.route('/stats', methods=['GET'])
def get_dashboard_data():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = DashboardData.query.filter_by(user_id=user_id).order_by(DashboardData.recorded_at.desc()).limit(1).first()
    if not data:
        return jsonify({"message": "No Data Available"}), 200

    return jsonify({
        "temperature": data.temperature,
        "humidity": data.humidity,
        "light": data.light,
        "ph": data.ph,
        "recorded_at": data.recorded_at.isoformat()
    })


@bp.route('/stats', methods=['POST'])
def add_dashboard_data():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    new_entry = DashboardData(
        user_id=user_id,
        temperature=data.get("temperature"),
        humidity=data.get("humidity"),
        light=data.get("light"),
        ph=data.get("ph")
    )
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Data added successfully."})


# ✅ Weather Data API (OpenWeatherMap via Coordinates)
@bp.route('/weather', methods=['POST'])
def get_weather():
    coords = request.get_json()
    lat = coords.get("latitude")
    lon = coords.get("longitude")
    if not lat or not lon:
        return jsonify({"error": "Missing coordinates"}), 400

    weather_api_key = os.getenv("WEATHER_API_KEY")
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={weather_api_key}&units=metric"
    response = requests.get(url)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch weather data"}), 500

    data = response.json()
    return jsonify({
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "city": data["name"],
        "country": data["sys"]["country"]
    })


# ✅ Vitamin D API (Geolocation + Manual Cities)
@bp.route('/vitamin_d', methods=['POST'])
def get_vitamin_d_recommendations():
    data = request.get_json()
    city = data.get("city")
    lat = data.get("latitude")
    lon = data.get("longitude")

    if city:
        # Manually Selected Cities (Expandable)
        recommendations = {
            "New York": "15 minutes sunlight between 10am-3pm",
            "London": "30 minutes sunlight recommended",
            "Tokyo": "20 minutes sunlight recommended",
            "Dhaka": "10 minutes sunlight sufficient",
            "Sydney": "25 minutes sunlight recommended"
        }
        suggestion = recommendations.get(city, "No data for this city yet.")
        return jsonify({"recommendation": suggestion})

    elif lat and lon:
        # Based on Coordinates (Simple Calculation Example)
        sun_exposure = 15 + int(float(lat)) % 10  # Sample logic, can be improved
        return jsonify({
            "recommendation": f"{sun_exposure} minutes of sunlight recommended based on your location."
        })

    else:
        return jsonify({"error": "No location or city provided."}), 400
