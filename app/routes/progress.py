from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models import UserProgress, UserActivity, RankObjective, UserObjectiveProgress, log_user_activity
from app import db
from datetime import datetime, timedelta

bp = Blueprint('progress', __name__, url_prefix='/api/progress')

@bp.route('/', methods=['GET'])
@login_required
def get_progress():
    """Get the current user's progress information"""
    progress = UserProgress.query.filter_by(user_id=current_user.id).first()
    
    if not progress:
        # Create initial progress record if it doesn't exist
        progress = UserProgress(
            user_id=current_user.id,
            level=1,
            rank='Beginner',
            points=0,
            next_level_points=100
        )
        db.session.add(progress)
        db.session.commit()
    
    # Calculate percentage to next level
    percentage = min(int((progress.points / progress.next_level_points) * 100), 100) if progress.next_level_points > 0 else 100
    
    return jsonify({
        'level': progress.level,
        'rank': progress.rank,
        'points': progress.points,
        'next_level': progress.next_level_points,
        'percentage': percentage
    })

@bp.route('/activities', methods=['GET'])
@login_required
def get_activities():
    """Get the current user's activity history"""
    # Get query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit per_page to reasonable values
    per_page = min(per_page, 50)
    
    # Query activities with pagination
    activities = UserActivity.query.filter_by(user_id=current_user.id)\
        .order_by(UserActivity.timestamp.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    result = {
        'activities': [],
        'pagination': {
            'total': activities.total,
            'pages': activities.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': activities.has_next,
            'has_prev': activities.has_prev
        }
    }
    
    for activity in activities.items:
        result['activities'].append({
            'id': activity.id,
            'action_type': activity.action_type,
            'count': activity.count,
            'timestamp': activity.timestamp.isoformat()
        })
    
    return jsonify(result)

@bp.route('/objectives', methods=['GET'])
@login_required
def get_objectives():
    """Get all objectives and the user's progress on them"""
    # Get all objectives
    objectives = RankObjective.query.all()
    
    result = []
    for objective in objectives:
        # Check if user has progress on this objective
        progress = UserObjectiveProgress.query.filter_by(
            user_id=current_user.id,
            objective_id=objective.id
        ).first()
        
        # If no progress record exists, create one
        if not progress:
            progress = UserObjectiveProgress(
                user_id=current_user.id,
                objective_id=objective.id,
                progress=0,
                completed=False
            )
            db.session.add(progress)
            db.session.commit()
        
        # Calculate percentage
        percentage = min(int((progress.progress / objective.target) * 100), 100) if objective.target > 0 else 0
        
        result.append({
            'id': objective.id,
            'title': objective.title,
            'description': objective.description,
            'category': objective.category,
            'points': objective.points,
            'target': objective.target,
            'progress': progress.progress,
            'completed': progress.completed,
            'percentage': percentage
        })
    
    return jsonify(result)

@bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    """Get user statistics for the dashboard"""
    # Get date range from query parameters (default to last 7 days)
    days = request.args.get('days', 7, type=int)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Get activities in date range
    activities = UserActivity.query.filter(
        UserActivity.user_id == current_user.id,
        UserActivity.timestamp >= start_date,
        UserActivity.timestamp <= end_date
    ).all()
    
    # Count activities by type
    activity_counts = {}
    total_points = 0
    
    for activity in activities:
        action_type = activity.action_type
        if action_type not in activity_counts:
            activity_counts[action_type] = 0
        
        activity_counts[action_type] += activity.count
        total_points += activity.count * 5  # 5 points per activity count
    
    # Get completed objectives count
    completed_objectives = UserObjectiveProgress.query.filter_by(
        user_id=current_user.id,
        completed=True
    ).count()
    
    return jsonify({
        'period_days': days,
        'total_points': total_points,
        'activity_counts': activity_counts,
        'completed_objectives': completed_objectives
    })