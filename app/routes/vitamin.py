# app/routes/vitamin.py
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify, session
from config import OPENWEATHER_API_KEY

# Optional DB import; wrapped to not break if missing
try:
    from app import db
    from app.models import VitaminDRecord
except Exception:
    db = None
    VitaminDRecord = None

bp = Blueprint("vitamin", __name__, url_prefix="/api/vitamin")

def _geo_from_city(city: str):
    """
    Resolve city -> (lat, lon, display_name).
    Prefer OpenWeather geocoding if key is present; otherwise fall back to Open-Meteo geocoding.
    """
    city = (city or "").strip()
    if not city:
        return None

    if OPENWEATHER_API_KEY:
        try:
            url = "https://api.openweathermap.org/geo/1.0/direct"
            r = requests.get(url, params={"q": city, "limit": 1, "appid": OPENWEATHER_API_KEY}, timeout=10)
            r.raise_for_status()
            data = r.json() or []
            if data:
                d = data[0]
                return float(d["lat"]), float(d["lon"]), f'{d.get("name","")}, {d.get("country","")}'
        except Exception:
            pass

    # Fallback: Open-Meteo geocoding (free)
    url = "https://geocoding-api.open-meteo.com/v1/search"
    r = requests.get(url, params={"name": city, "count": 1}, timeout=10)
    r.raise_for_status()
    data = (r.json() or {}).get("results") or []
    if not data:
        return None
    d = data[0]
    name = d.get("name", "")
    country = d.get("country", "")
    return float(d["latitude"]), float(d["longitude"]), f"{name}, {country}".strip(", ")

def _owm_onecall(lat: float, lon: float):
    """
    Try OpenWeather One Call 3.0 current.
    Note: free tier often returns uv as None; we still try and then fall back.
    """
    url = "https://api.openweathermap.org/data/3.0/onecall"
    r = requests.get(
        url,
        params={
            "lat": lat,
            "lon": lon,
            "exclude": "minutely,hourly,daily,alerts",
            "units": "metric",
            "appid": OPENWEATHER_API_KEY,
        },
        timeout=10,
    )
    r.raise_for_status()
    cur = (r.json() or {}).get("current", {}) or {}
    uv = cur.get("uvi")
    temp = cur.get("temp")
    hum = cur.get("humidity")
    clouds = cur.get("clouds")
    return uv, temp, hum, clouds, "openweather_onecall"

def _open_meteo(lat: float, lon: float):
    """
    Free + reliable UV via Open-Meteo.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    r = requests.get(
        url,
        params={
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,uv_index,cloud_cover",
        },
        timeout=10,
    )
    r.raise_for_status()
    cur = (r.json() or {}).get("current", {}) or {}
    uv = cur.get("uv_index")
    temp = cur.get("temperature_2m")
    hum = cur.get("relative_humidity_2m")
    clouds = cur.get("cloud_cover")
    return uv, temp, hum, clouds, "open-meteo"

def _safe_exposure_minutes(uv: float, skin_type: int = 3) -> int | None:
    """
    Super-simple estimate. If uv missing or <= 0, return None.
    Rough mapping per WHO-like guidance; you can tune coefficients per Fitzpatrick types.
    """
    if uv is None or uv <= 0:
        return None
    # baseline minutes to mild erythema for Fitzpatrick III; adjust by skin_type
    # Type I: *0.6, II: *0.8, III: *1.0, IV: *1.3, V: *1.6, VI: *2.0 (rough)
    factors = {1: 0.6, 2: 0.8, 3: 1.0, 4: 1.3, 5: 1.6, 6: 2.0}
    k = factors.get(int(skin_type) if skin_type else 3, 1.0)
    # very rough: time ~ 60 / uv (minutes), scaled
    minutes = int(max(5, min(120, (60 / max(uv, 0.1)) * k)))
    return minutes

@bp.route("/estimate", methods=["POST"])
def estimate():
    """
    Body: { lat, lon, skin_type? } or { city, skin_type? }
    Returns: { uv_index, temperature_c, humidity_pct, cloud_cover_pct, suggested_exposure_minutes, risk, coords, city, source }
    """
    data = request.get_json(silent=True) or {}
    city = (data.get("city") or "").strip()
    lat = data.get("lat")
    lon = data.get("lon")
    skin_type = int(data.get("skin_type", 3))

    if not ((lat is not None and lon is not None) or city):
        return jsonify({"error": "Provide either (lat & lon) or a city name."}), 400

    resolved_city = None
    try:
        if city and (lat is None or lon is None):
            got = _geo_from_city(city)
            if not got:
                return jsonify({"error": f"Could not geocode city: {city}"}), 404
            lat, lon, resolved_city = got
        else:
            lat = float(lat)
            lon = float(lon)
    except Exception as e:
        return jsonify({"error": f"Invalid coordinates or city. Details: {e}"}), 400

    # Try OWM if key present, then fall back to Open-Meteo
    uv = temp = hum = clouds = None
    src = None
    if OPENWEATHER_API_KEY:
        try:
            uv, temp, hum, clouds, src = _owm_onecall(lat, lon)
        except Exception:
            pass

    if uv is None:
        try:
            uv, temp, hum, clouds, src = _open_meteo(lat, lon)
        except Exception as e:
            return jsonify({"error": f"Could not fetch UV/Weather. Details: {e}"}), 502

    # risk bucket
    if uv is None:
        status = "Low"
    elif uv < 3:
        status = "Low"
    elif uv < 6:
        status = "Moderate"
    elif uv < 8:
        status = "High"
    elif uv < 11:
        status = "Very High"
    else:
        status = "Extreme"

    minutes = _safe_exposure_minutes(uv, skin_type)

    # Optional: persist
    try:
        user_id = session.get("user_id")
        if db and VitaminDRecord and user_id:
            rec = VitaminDRecord(
                user_id=user_id,
                latitude=lat,
                longitude=lon,
                city=resolved_city or (city or None),
                uv_index=uv,
                temperature_c=temp,
                humidity_pct=hum,
                cloud_cover_pct=clouds,
                suggested_minutes=minutes,
                source=src,
                created_at=datetime.utcnow(),
            )
            db.session.add(rec)
            db.session.commit()
    except Exception:
        # Do not block response on DB issues
        pass

    return jsonify({
        "coords": {"lat": lat, "lon": lon},
        "city": resolved_city or (city or None),
        "uv_index": uv,
        "temperature_c": temp,
        "humidity_pct": hum,
        "cloud_cover_pct": clouds,
        "risk": status,
        "suggested_exposure_minutes": minutes,
        "source": src,
    }), 200