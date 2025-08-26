from flask import Blueprint, jsonify, session
from app.models import Notification

bp = Blueprint("notifications", __name__)

@bp.route("/notifications", methods=["GET"])
def list_notifications():
    user_id = session.get("user_id")
    notes = Notification.query.filter_by(user_id=user_id).all()
    return jsonify([{"id": n.id, "message": n.message, "seen": n.seen} for n in notes])
