import requests
from flask import Blueprint, request, jsonify, session
from app.models import VitaminDRecord
from app import db
from config import OPENWEATHER_API_KEY

bp = Blueprint("vitamin", __name__)

@bp.route("/vitamin", methods=["POST"])
def estimate_vitamin_d():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing or invalid JSON body"}), 400

        city = data.get("city")
        lat = data.get("lat")
        lon = data.get("lon")
        skin_type = int(data.get("skin_type", 3))
        exposure_time = int(data.get("exposure_time", 15))
        
        # For demo purposes, if no user in session, use a default
        user_id = session.get("user_id", 1)

        if not (lat and lon) and not city:
            return jsonify({"error": "City or coordinates required"}), 400

        # If only city provided, get coordinates
        if city and not (lat and lon):
            geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={OPENWEATHER_API_KEY}"
            geo_res = requests.get(geo_url).json()
            if not geo_res:
                return jsonify({"error": "City not found"}), 404
            lat = geo_res[0]["lat"]
            lon = geo_res[0]["lon"]

        # Get UV Index from One Call API
        onecall_url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly,daily,alerts&appid={OPENWEATHER_API_KEY}&units=metric"
        res = requests.get(onecall_url).json()

        if "current" not in res:
            return jsonify({"error": "Could not fetch weather data"}), 500

        uv_index = res["current"].get("uvi", 0)
        temperature = res["current"].get("temp", 0)
        humidity = res["current"].get("humidity", 0)

        # Estimate Vitamin D status
        if uv_index < 3:
            vitamin_status = "Low"
        elif 3 <= uv_index <= 6:
            vitamin_status = "Moderate"
        else:
            vitamin_status = "High"

        # Calculate recommended exposure time based on UV index and skin type
        base_exposure = 15  # minutes for moderate UV and skin type 3
        recommended_time = round((base_exposure * 3) / (uv_index * skin_type) * 10)

        # Save record to DB
        record = VitaminDRecord(
            user_id=user_id,
            latitude=lat,
            longitude=lon,
            uv_index=uv_index,
            status=vitamin_status,
        )
        db.session.add(record)
        db.session.commit()

        return jsonify({
            "uv_index": uv_index,
            "temperature": temperature,
            "humidity": humidity,
            "vitamin_status": vitamin_status,
            "recommended_exposure": recommended_time,
            "skin_type": skin_type,
            "exposure_time": exposure_time,
            "location": f"Lat: {lat}, Lon: {lon}" if not city else city
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route("/vitamin/history", methods=["GET"])
def vitamin_history():
    user_id = session.get("user_id")
    records = (
        VitaminDRecord.query.filter_by(user_id=user_id)
        .order_by(VitaminDRecord.timestamp.asc())
        .all()
    )
    history = [
        {
            "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M"),
            "uv_index": r.uv_index,
            "status": r.status,
        }
        for r in records
    ]
    return jsonify(history)