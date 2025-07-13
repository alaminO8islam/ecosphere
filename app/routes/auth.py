from flask import Blueprint, jsonify, request, session, redirect, url_for
from flask_dance.contrib.google import make_google_blueprint, google
from ..models import db, User
import os
import random

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# OAuth Blueprint for Google
google_bp = make_google_blueprint(
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    scope=["profile", "email"],
)
bp.register_blueprint(google_bp, url_prefix="/login")


@bp.route('/google/callback')
def google_callback():
    if not google.authorized:
        return redirect(url_for("google.login"))

    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        return "Failed to fetch user info", 400

    user_info = resp.json()
    email = user_info["email"]
    name = user_info.get("name", "Unknown User")
    avatar = user_info.get("picture", "")

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, name=name, avatar=avatar, guest=False)  # type: ignore
        db.session.add(user)
        db.session.commit()

    session['user_id'] = user.id
    session['guest'] = False

    return redirect("/app/dashboard.html")  # Redirect to dashboard page


@bp.route('/guest', methods=['POST'])
def guest_login():
    random_id = random.randint(100000, 999999)  # 6-digit random ID
    guest_user = User(
        email=None,
        name=f"Guest_{random_id}",  # Auto-generated Guest name
        avatar="default-avatar.png",
        guest=True
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


@bp.route('/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id')
    is_guest = session.get('guest', False)

    if user_id:
        if is_guest:
            # Delete guest account & data
            user = User.query.get(user_id)
            if user:
                db.session.delete(user)
                db.session.commit()
        session.clear()

    return jsonify({"message": "Logged out successfully."})


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
        "name": user.name,
        "avatar": user.avatar,
        "rank": user.rank,
        "progress": user.progress,
        "guest": user.guest
    })


@bp.route('/update_profile', methods=['POST'])
def update_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    user = User.query.get(user_id)
    user.name = data.get("name", user.name)  # type: ignore
    user.avatar = data.get("avatar", user.avatar)  # type: ignore
    db.session.commit()

    return jsonify({"message": "Profile updated successfully."})
