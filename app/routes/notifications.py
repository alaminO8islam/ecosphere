from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models import Notification
from app import db
from datetime import datetime

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@bp.route('/', methods=['GET'])
@login_required
def get_notifications():
    notifications = Notification.query.filter_by(
        user_id=current_user.id
    ).order_by(Notification.created_at.desc()).all()
    
    result = []
    for notification in notifications:
        result.append({
            'id': notification.id,
            'message': notification.message,
            'read': notification.read,
            'created_at': notification.created_at.isoformat()
        })
    
    return jsonify(result)

@bp.route('/unread', methods=['GET'])
@login_required
def get_unread_notifications():
    notifications = Notification.query.filter_by(
        user_id=current_user.id,
        read=False
    ).order_by(Notification.created_at.desc()).all()
    
    result = []
    for notification in notifications:
        result.append({
            'id': notification.id,
            'message': notification.message,
            'created_at': notification.created_at.isoformat()
        })
    
    return jsonify(result)

@bp.route('/count', methods=['GET'])
@login_required
def get_unread_count():
    count = Notification.query.filter_by(
        user_id=current_user.id,
        read=False
    ).count()
    
    return jsonify({
        'count': count
    })

@bp.route('/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_as_read(notification_id):
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=current_user.id
    ).first()
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.read = True
    db.session.commit()
    
    return jsonify({
        'message': 'Notification marked as read'
    })

@bp.route('/read-all', methods=['PUT'])
@login_required
def mark_all_as_read():
    Notification.query.filter_by(
        user_id=current_user.id,
        read=False
    ).update({Notification.read: True})
    
    db.session.commit()
    
    return jsonify({
        'message': 'All notifications marked as read'
    })
