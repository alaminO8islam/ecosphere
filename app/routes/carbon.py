from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from app.models import CarbonLog, log_user_activity
from app import db

bp = Blueprint('carbon', __name__, url_prefix='/api/carbon')

# API routes for carbon calculators
@bp.route('/transport')
def transport_calculator():
    return render_template('transport.html')

@bp.route('/food')
def food_calculator():
    return render_template('food.html')

@bp.route('/energy')
def energy_calculator():
    return render_template('energy.html')

@bp.route('/')
@login_required
def index():
    return render_template('carbon.html')

@bp.route('/api/log', methods=['POST'])
@login_required
def log_carbon():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    new_log = CarbonLog(
        user_id=current_user.id,
        transport=data.get('transport', 0),
        food=data.get('food', 0),
        energy=data.get('energy', 0)
    )
    
    db.session.add(new_log)
    db.session.commit()
    
    # Log this activity for user progress
    log_user_activity(current_user.id, 'carbon_check')
    
    return jsonify({
        'message': 'Carbon footprint logged successfully',
        'id': new_log.id
    }), 201

@bp.route('/api/history')
@login_required
def get_carbon_history():
    logs = CarbonLog.query.filter_by(user_id=current_user.id).order_by(CarbonLog.logged_at.desc()).limit(10).all()
    
    result = []
    for log in logs:
        result.append({
            'id': log.id,
            'transport': log.transport,
            'food': log.food,
            'energy': log.energy,
            'total': log.transport + log.food + log.energy,
            'logged_at': log.logged_at.isoformat()
        })
    
    return jsonify(result)
