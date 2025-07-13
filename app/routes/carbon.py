from flask import Blueprint, jsonify, request, session
from ..models import db, CarbonLog

bp = Blueprint('carbon', __name__, url_prefix='/api/carbon')

@bp.route('/logs', methods=['GET'])
def get_logs():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    logs = CarbonLog.query.filter_by(user_id=user_id).order_by(CarbonLog.logged_at.desc()).all()
    return jsonify([
        {
            "id": l.id,
            "transport": l.transport,
            "food": l.food,
            "energy": l.energy,
            "logged_at": l.logged_at.isoformat()
        }
        for l in logs
    ])


@bp.route('/logs', methods=['POST'])
def add_log():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    new_log = CarbonLog(
        user_id=user_id,
        transport=data.get("transport"),
        food=data.get("food"),
        energy=data.get("energy")
    )
    db.session.add(new_log)
    db.session.commit()
    return jsonify({"message": "Carbon log added successfully."})
