import requests
from flask import Blueprint, request, jsonify, session
from app.models import VitaminDRecord
from app import db
from config import OPENWEATHER_API_KEY

bp = Blueprint("vitamin", __name__)

@bp.route("/vitamin", methods=["POST"])
def estimate_vitamin_d():
    data = request.json
    if data is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    city = data.get("city")
    lat = data.get("lat")
    lon = data.get("lon")
    skin_type = int(data.get("skin_type", 3))
    exposure_time = int(data.get("exposure_time", 15))
    user_id = session.get("user_id")

    if not (lat and lon) and not city:
        return jsonify({"error": "City or coordinates required"}), 400

    # Step 1: If only city provided, get coordinates
    if city and not (lat and lon):
        geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={OPENWEATHER_API_KEY}"
        geo_res = requests.get(geo_url).json()
        if not geo_res:
            return jsonify({"error": "City not found"}), 404
        lat = geo_res[0]["lat"]
        lon = geo_res[0]["lon"]

    # Step 2: Get UV Index from One Call API
    onecall_url = (
        f"https://api.openweathermap.org/data/3.0/onecall?"
        f"lat={lat}&lon={lon}&exclude=minutely,hourly,daily,alerts&appid={OPENWEATHER_API_KEY}"
    )
    res = requests.get(onecall_url).json()

    if "current" not in res:
        return jsonify({"error": "Could not fetch UV index"}), 500

    uv_index = res["current"].get("uvi", None)

    if uv_index is None:
        return jsonify({"error": "No UV data available"}), 500

    # Step 3: Estimate Vitamin D status
    if uv_index < 3:
        vitamin_status = "Low"
    elif 3 <= uv_index <= 6:
        vitamin_status = "Moderate"
    else:
        vitamin_status = "High"

    # Example dose calculation
    dose = round(uv_index * exposure_time / skin_type, 2)

    # Step 4: Save record to DB
    record = VitaminDRecord(
        user_id=user_id,
        latitude=lat,
        longitude=lon,
        uv_index=uv_index,
        status=vitamin_status,
    )
    db.session.add(record)
    db.session.commit()

    return jsonify(
        {
            "uv_index": uv_index,
            "vitamin_status": vitamin_status,
            "dose_score": dose,
            "skin_type": skin_type,
            "exposure_time": exposure_time,
        }
    )

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
