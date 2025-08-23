from flask import Blueprint, request, jsonify, session
from ..models import db, CarbonLog
from datetime import datetime

bp = Blueprint('carbon', __name__, url_prefix='/api/carbon')

EMISSION_FACTORS = {
    "food": 5.0,
    "transport": 0.27,
    "energy": 0.85     
}

@bp.route('/log', methods=['POST'])
def log_carbon():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    food = float(data.get("food", 0))
    transport = float(data.get("transport", 0))
    energy = float(data.get("energy", 0))

    # CO₂ emission calculation
    total_emission = (
        food * EMISSION_FACTORS["food"] +
        transport * EMISSION_FACTORS["transport"] +
        energy * EMISSION_FACTORS["energy"]
    )

    # Save carbon log
    log = CarbonLog(
        user_id=user_id,
        food=food,
        transport=transport,
        energy=energy,
        logged_at=datetime.utcnow()
    )
    db.session.add(log)

    # Update user progress + rank
    user = db.session.get(CarbonLog.user.property.mapper.class_, user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    gain = max(10, 100 - int(total_emission))  # More eco-friendly = higher gain
    user.progress += gain

    if user.progress >= 100:
        user.rank = str(int(user.rank or 1) + 1)
        user.progress = 0

    db.session.commit()

    return jsonify({
        "message": "Carbon data logged",
        "total_emission": total_emission,
        "progress": user.progress,
        "rank": user.rank
    })

@bp.route('/history', methods=['GET'])
def carbon_history():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    logs = CarbonLog.query.filter_by(user_id=user_id).order_by(CarbonLog.logged_at.desc()).limit(30).all()
    history = [{
        "date": log.logged_at.strftime("%Y-%m-%d"),
        "food": log.food,
        "transport": log.transport,
        "energy": log.energy,
        "total": round(
            log.food * EMISSION_FACTORS["food"] +
            log.transport * EMISSION_FACTORS["transport"] +
            log.energy * EMISSION_FACTORS["energy"],
            2
        )
    } for log in reversed(logs)]

    return jsonify(history)