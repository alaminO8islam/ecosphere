from flask import Blueprint, jsonify, session, request
from ..models import db, Notification

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@bp.route('/', methods=['GET'])
def get_notifications():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.timestamp.desc()).all()
    return jsonify([
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "timestamp": n.timestamp.isoformat()
        }
        for n in notifications
    ])


@bp.route('/mark_read', methods=['POST'])
def mark_notification_read():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    notif_id = data.get("id")
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if notif:
        notif.is_read = True
        db.session.commit()
        return jsonify({"message": "Notification marked as read"})
    else:
        return jsonify({"error": "Notification not found"}), 404
