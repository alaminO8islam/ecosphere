from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models import User, get_user_by_id, log_user_activity
from app import db

bp = Blueprint('users', __name__, url_prefix='/api/users')

@bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """Get the current user's profile information"""
    return jsonify(current_user.to_dict())

@bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update the current user's profile information"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Fields that can be updated
    allowed_fields = ['first_name', 'last_name', 'location', 'bio']
    
    for field in allowed_fields:
        if field in data:
            setattr(current_user, field, data[field])
    
    # Handle password update separately with validation
    if 'password' in data and data.get('current_password'):
        # Verify current password
        if not current_user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Set new password
        current_user.password = data['password']
    
    db.session.commit()
    
    # Log this activity
    log_user_activity(current_user.id, 'profile_update')
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': current_user.to_dict()
    })

@bp.route('/stats', methods=['GET'])
@login_required
def get_user_stats():
    """Get the current user's statistics and progress"""
    # Get user progress
    progress = current_user.progress
    
    if not progress:
        return jsonify({
            'level': 1,
            'rank': 'Beginner',
            'points': 0,
            'next_level': 100,
            'percentage': 0
        })
    
    # Calculate percentage to next level
    next_level_points = progress.next_level_points
    current_points = progress.points
    percentage = min(int((current_points / next_level_points) * 100), 100) if next_level_points > 0 else 100
    
    return jsonify({
        'level': progress.level,
        'rank': progress.rank,
        'points': progress.points,
        'next_level': next_level_points,
        'percentage': percentage
    })

@bp.route('/activities', methods=['GET'])
@login_required
def get_user_activities():
    """Get the current user's recent activities"""
    activities = current_user.activities.order_by(User.UserActivity.timestamp.desc()).limit(20).all()
    
    result = []
    for activity in activities:
        result.append({
            'id': activity.id,
            'action_type': activity.action_type,
            'timestamp': activity.timestamp.isoformat(),
            'count': activity.count
        })
    
    return jsonify(result)

@bp.route('/objectives', methods=['GET'])
@login_required
def get_user_objectives():
    """Get the current user's objectives and progress"""
    objectives_progress = current_user.objectives_progress.all()
    
    result = []
    for obj_progress in objectives_progress:
        objective = obj_progress.objective
        result.append({
            'id': objective.id,
            'title': objective.title,
            'description': objective.description,
            'points': objective.points,
            'completed': obj_progress.completed,
            'progress': obj_progress.progress,
            'target': objective.target
        })
    
    return jsonify(result)