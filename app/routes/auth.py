from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from ..models import db, User
import random, string, time

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

verification_store = {}

@bp.route('/guest', methods=['POST'])
def guest_login():
    random_id = random.randint(100000, 999999)
    guest_user = User(
        email=None,
        name=f"Guest_{random_id}",
        avatar="default-avatar.png",
        guest=True,
        rank=1,
        progress=0
    )
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
        "rank": user.rank,
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
        "rank": 1,
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
    
    return jsonify({"message": "Verified. Now ask for birthday."})

@bp.route('/save_birthday', methods=['POST'])
def save_birthday():
    data = request.get_json()
    birthday = data.get("birthday")
    user = User.query.get(session.get('user_id'))
    if user:
        user.birthday = birthday
        db.session.commit()
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
        "rank": user.rank,
        "progress": user.progress,
        "guest": user.guest
    })
