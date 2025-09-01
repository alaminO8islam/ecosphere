# app/routes/env.py
import requests
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from config import OPENWEATHER_API_KEY

bp = Blueprint("env", __name__)

def _geo_from_city(city: str):
    """Resolve city -> (lat, lon, display)."""
    city = (city or "").strip()
    if not city:
        return None

    # Prefer OWM geocoding if available
    if OPENWEATHER_API_KEY:
        try:
            url = "https://api.openweathermap.org/geo/1.0/direct"
            r = requests.get(url, params={"q": city, "limit": 1, "appid": OPENWEATHER_API_KEY}, timeout=10)
            r.raise_for_status()
            arr = r.json() or []
            if arr:
                d = arr[0]
                return float(d["lat"]), float(d["lon"]), f'{d.get("name","")}, {d.get("country","")}'
        except Exception:
            pass

    # Fallback: Open-Meteo geocoding
    url = "https://geocoding-api.open-meteo.com/v1/search"
    r = requests.get(url, params={"name": city, "count": 1}, timeout=10)
    r.raise_for_status()
    results = (r.json() or {}).get("results") or []
    if not results:
        return None
    d = results[0]
    name = d.get("name", "")
    country = d.get("country", "")
    return float(d["latitude"]), float(d["longitude"]), f"{name}, {country}".strip(", ")

def _open_meteo_current(lat: float, lon: float):
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
    return {
        "temperature_c": cur.get("temperature_2m"),
        "humidity_pct": cur.get("relative_humidity_2m"),
        "uv_index": cur.get("uv_index"),
        "cloud_cover_pct": cur.get("cloud_cover"),
        "source": "open-meteo",
    }

@bp.route("/now", methods=["POST"])
def env_now():
    """
    Body: { lat, lon } or { city }
    Returns: { uv_index, temperature_c, humidity_pct, cloud_cover_pct, light_level, ph, coords, city, source, timestamp }
    """
    data = request.get_json(silent=True) or {}
    lat = data.get("lat")
    lon = data.get("lon")
    city = (data.get("city") or "").strip()

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

    try:
        payload = _open_meteo_current(lat, lon)
    except Exception as e:
        return jsonify({"error": f"Could not fetch current conditions. Details: {e}"}), 502

    uv = payload.get("uv_index")
    clouds = payload.get("cloud_cover_pct")

    # Simple “light level” heuristic (0–100) from UV & clouds
    light_level = None
    if uv is not None or clouds is not None:
        base = (uv or 0) * 10          # UV 0–11+ → ~0–110
        cloud_penalty = (clouds or 0) * 0.5
        light_level = max(0, min(100, int(base - cloud_penalty)))

    result = {
        "coords": {"lat": lat, "lon": lon},
        "city": resolved_city or (city or None),
        "temperature_c": payload.get("temperature_c"),
        "humidity_pct": payload.get("humidity_pct"),
        "uv_index": uv,
        "cloud_cover_pct": clouds,
        "light_level": light_level,
        # No public weather API gives pH; keep null and let IoT/sensor fill later.
        "ph": None,
        "source": payload.get("source"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return jsonify(result), 200
