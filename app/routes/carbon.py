from flask import Blueprint, request, jsonify, session, render_template
from ..models import db, CarbonLog, User
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

    total_emission = (
        food * EMISSION_FACTORS["food"] +
        transport * EMISSION_FACTORS["transport"] +
        energy * EMISSION_FACTORS["energy"]
    )

    log = CarbonLog(
        user_id=user_id,
        food=food,
        transport=transport,
        energy=energy,
        logged_at=datetime.utcnow()
    )
    db.session.add(log)

    # Update user progress + rank
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    gain = max(10, 100 - int(total_emission))  # More eco-friendly = higher gain
    user.progress += gain

    if user.progress >= 100:
        user.user_rank = int(user.user_rank or 1) + 1  # ← CHANGED: user.rank to user.user_rank
        user.progress = 0

    db.session.commit()

    return jsonify({
        "message": "Carbon data logged",
        "total_emission": total_emission,
        "progress": user.progress,
        "rank": user.user_rank  # ← CHANGED: user.rank to user.user_rank
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

@bp.route('/transport')
def transport_calculator():
    return render_template('transport.html')

@bp.route('/food')
def food_calculator():
    return render_template('food.html')

@bp.route('/energy')
def energy_calculator():
    return render_template('energy.html')