from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from ..models import db, User, CarbonLog, DashboardData, Note
import random, string, time
from datetime import datetime

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

verification_store = {}

@bp.route('/guest', methods=['POST'])
def guest_login():
    random_id = random.randint(100000, 999999)
    guest_user = User(
        first_name=f"Guest_{random_id}" # pyright: ignore[reportCallIssue]
    )
    guest_user.progress = 0
    guest_user.user_rank = 1
    guest_user.guest = True
    guest_user.avatar = "default-avatar.png"
    db.session.add(guest_user)
    db.session.commit()
    session['user_id'] = guest_user.id
    session['guest'] = True

    return jsonify({
        "message": "Guest login successful",
        "user_id": guest_user.id,
        "name": guest_user.name
    })

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    session['user_id'] = user.id
    session['guest'] = False
    return jsonify({
        "message": "Login successful",
        "user_id": user.id,
        "name": user.name,
        "avatar": user.avatar,
        "rank": user.user_rank,
        "progress": user.progress
    })

@bp.route('/create_account', methods=['POST'])
def create_account():
    data = request.get_json()
    first = data.get('first_name')
    last = data.get('last_name')
    email = data.get('email')
    password = data.get('password')
    
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    code = ''.join(random.choices(string.digits, k=6))
    verification_store[email] = {
        "code": code,
        "timestamp": time.time(),
        "user_data": {
            "first_name": first,
            "last_name": last,
            "email": email,
            "password": generate_password_hash(password),
            "avatar": "default-avatar.png",
            "guest": False,
            "user_rank": 1,
            "progress": 0
        }
    }
    return jsonify({"message": "Code generated", "code": code}), 200

@bp.route('/verify_code', methods=['POST'])
def verify_code():
    data = request.get_json()
    email = data.get('email')
    input_code = data.get('code')
    
    entry = verification_store.get(email)
    if not entry:
        return jsonify({"error": "No verification attempt found"}), 404
    
    if time.time() - entry["timestamp"] > 60:
        del verification_store[email]
        return jsonify({"error": "Code expired"}), 410
    
    if input_code != entry["code"]:
        return jsonify({"error": "Invalid code"}), 401
    
    user_data = entry["user_data"]
    new_user = User(**user_data)
    db.session.add(new_user)
    db.session.commit()
    
    session['user_id'] = new_user.id
    session['guest'] = False
    
    del verification_store[email]
    
    return jsonify({
        "message": "Verified. Now ask for birthday.",
        "user_id": new_user.id
    })

@bp.route('/save_birthday', methods=['POST'])
def save_birthday():
    data = request.get_json()
    birthday_str = data.get("birthday")
    user_id = data.get("user_id") or session.get('user_id') 

    try:
        birthday_date = datetime.strptime(birthday_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid birthday format."}), 400

    user = User.query.get(user_id)
    if user:
        user.birthday = birthday_date
        db.session.commit()
        if not session.get('user_id'):
            session['user_id'] = user.id
            session['guest'] = False
        return jsonify({"message": "Birthday saved. Welcome!"})
    return jsonify({"error": "User not found"}), 404

@bp.route('/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id')
    is_guest = session.get('guest', False)

    if user_id and is_guest:
        user = User.query.get(user_id)
        if user:
            db.session.delete(user)
            db.session.commit()
    session.clear()
    return jsonify({"message": "Logged out."})

@bp.route('/profile/update', methods=['POST', 'PUT'])
def update_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401
    
    data = request.get_json()
    
    # Debug: Print what we're receiving
    print(f"🔧 PROFILE UPDATE - User ID: {user_id}, Data: {data}")
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Get current values for debugging
    current_data = {
        'name': user.name,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email
    }
    print(f"🔧 BEFORE UPDATE - User {user_id}: {current_data}")
    
    # Update only the provided fields
    updated_fields = []
    if 'name' in data and data['name'] != user.name:
        user.name = data['name']
        updated_fields.append('name')
    if 'first_name' in data and data['first_name'] != user.first_name:
        user.first_name = data['first_name']
        updated_fields.append('first_name')
    if 'last_name' in data and data['last_name'] != user.last_name:
        user.last_name = data['last_name']
        updated_fields.append('last_name')
    if 'email' in data and data['email'] != user.email:
        # Check if email is already taken by another user
        existing_user = User.query.filter(User.email == data['email'], User.id != user_id).first()
        if existing_user:
            return jsonify({"error": "Email already taken"}), 409
        user.email = data['email']
        updated_fields.append('email')
    
    if not updated_fields:
        return jsonify({"message": "No changes detected"}), 200
    
    db.session.commit()
    
    # Debug: Print after update
    print(f"✅ AFTER UPDATE - User {user_id} updated fields: {updated_fields}")
    print(f"✅ ALL USERS AFTER UPDATE:")
    all_users = User.query.all()
    for u in all_users:
        print(f"   User {u.id}: {u.first_name} {u.last_name} ({u.email})")
    
    return jsonify({
        "message": "Profile updated successfully",
        "updated_fields": updated_fields,
        "user": {
            "id": user.id,
            "name": user.name,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email
        }
    })

@bp.route('/debug/users')
def debug_users():
    users = User.query.all()
    user_list = []
    for u in users:
        user_list.append({
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "name": u.name,
            "birthday": str(u.birthday),
            "guest": u.guest,
            "user_rank": u.user_rank,
            "progress": u.progress
        })
    return jsonify(user_list)

@bp.route('/me', methods=['GET'])
def get_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user_id": user.id,
        "name": f"{user.first_name} {user.last_name}",
        "avatar": user.avatar,
        "rank": user.user_rank,
        "progress": user.progress,
        "guest": user.guest
    })

@bp.route('/debug/session')
def debug_session():
    return jsonify(dict(session))

@bp.route('/debug/all-data')
def debug_all_data():
    users = User.query.all()
    carbon_data = CarbonLog.query.all()
    dashboard_data = DashboardData.query.all()
    notes = Note.query.all()
    
    return jsonify({
        'users': [{'id': u.id, 'email': u.email, 'name': u.name} for u in users],
        'carbon_logs': [{'id': c.id, 'user_id': c.user_id, 'transport': c.transport} for c in carbon_data],
        'dashboard_data': [{'id': d.id, 'user_id': d.user_id, 'temperature': d.temperature} for d in dashboard_data],
        'notes': [{'id': n.id, 'user_id': n.user_id, 'title': n.title} for n in notes]
    })

# Catch-all for any other profile update endpoints that might exist
@bp.route('/api/profile/update', methods=['POST', 'PUT'])
@bp.route('/update-profile', methods=['POST', 'PUT'])
@bp.route('/api/update-profile', methods=['POST', 'PUT'])
@bp.route('/user/update', methods=['POST', 'PUT'])
@bp.route('/api/user/update', methods=['POST', 'PUT'])
def catch_all_profile_updates():
    user_id = session.get('user_id')
    data = request.get_json()
    
    print(f"🚨 CATCH-ALL PROFILE UPDATE CAUGHT!")
    print(f"   Endpoint: {request.path}")
    print(f"   User ID: {user_id}")
    print(f"   Data: {data}")
    
    return jsonify({
        "error": "This profile update endpoint is not properly implemented",
        "caught_by_debug": True,
        "current_user_id": user_id,
        "update_data": data,
        "all_users": [{"id": u.id, "name": u.name, "email": u.email} for u in User.query.all()]
    }), 500