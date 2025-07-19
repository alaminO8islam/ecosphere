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
