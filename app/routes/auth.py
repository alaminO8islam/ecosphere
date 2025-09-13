from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template, flash
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User, UserActivity
from app import db
import re
import random
from datetime import datetime, timedelta

# -------------------------
# Blueprints
# -------------------------
site_bp = Blueprint("site_auth", __name__)             # user-facing pages
api_bp = Blueprint("api_auth", __name__, url_prefix="/api/auth")  # JSON API

# Main blueprint to be imported in __init__.py
bp = site_bp

# Email validation regex pattern
email_pattern = re.compile(r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$')


# -------------------------
# User-facing routes (HTML)
# -------------------------

@site_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")

        error = None

        # Validation
        if not all([email, password, confirm_password, first_name, last_name]):
            error = "All fields are required."
        elif not email_pattern.match(email):
            error = "Please enter a valid email address."
        elif password != confirm_password:
            error = "Passwords do not match."
        elif len(password) < 8:
            error = "Password must be at least 8 characters long."

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            error = "Email already registered."

        if error is None:
            # Create and save new user
            new_user = User(
                email=email,
                password=password,  # setter in model will hash automatically
                first_name=first_name,
                last_name=last_name,
                name=f"{first_name} {last_name}"
            )
            db.session.add(new_user)
            db.session.commit()

            # Log the user in
            login_user(new_user)
            flash("Registration successful! Welcome to EcoSphere.", "success")
            return redirect(url_for("site_auth.dashboard"))

        flash(error, "error")

    return render_template("index.html")


@site_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        remember = True if request.form.get("remember") else False

        error = None

        if not email or not password:
            error = "Email and password are required."

        if error is None:
            user = User.query.filter_by(email=email).first()
            if user and check_password_hash(user.password, password):
                login_user(user, remember=remember)
                flash("Login successful!", "success")
                return redirect(url_for("site_auth.dashboard"))
            error = "Invalid email or password."

        flash(error, "error")

    return render_template("index.html")


@site_bp.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")


@site_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("site_auth.login"))


# -------------------------
# API routes (JSON)
# -------------------------

@api_bp.route("/create_account", methods=["POST"])
def api_create_account():
    data = request.get_json()
    if not data or not all(k in data for k in ["email", "password", "first_name", "last_name"]):
        return jsonify({"error": "Missing required fields"}), 400

    email = data["email"]
    password = data["password"]
    first_name = data["first_name"]
    last_name = data["last_name"]

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 409

    verification_code = "".join([str(random.randint(0, 9)) for _ in range(6)])

    session["verification_code"] = verification_code
    session["pending_email"] = email
    session["pending_first_name"] = first_name
    session["pending_last_name"] = last_name
    session["pending_password"] = password
    session["code_expiry"] = (datetime.now() + timedelta(seconds=60)).timestamp()

    return jsonify({
        "message": "Verification code sent",
        "code": verification_code,  # TODO: send via email in real app
        "expires_in": 60
    }), 200


@api_bp.route("/verify_code", methods=["POST"])
def api_verify_code():
    data = request.get_json()
    if not data or not all(k in data for k in ["email", "code"]):
        return jsonify({"error": "Missing email or verification code"}), 400

    email = data["email"]
    entered_code = data["code"]

    stored_code = session.get("verification_code")
    stored_email = session.get("pending_email")
    code_expiry = session.get("code_expiry")

    if not stored_code or not stored_email:
        return jsonify({"error": "No pending verification found"}), 400
    if stored_email != email:
        return jsonify({"error": "Email mismatch"}), 400
    if datetime.now().timestamp() > code_expiry:
        session.clear()
        return jsonify({"error": "Verification code expired"}), 400
    if stored_code != entered_code:
        return jsonify({"error": "Invalid verification code"}), 400

    session["verified"] = True
    return jsonify({"message": "Verification successful"}), 200


@api_bp.route("/save_birthday", methods=["POST"])
def api_save_birthday():
    data = request.get_json()
    if not data or "birthday" not in data:
        return jsonify({"error": "Missing birthday"}), 400
    if not session.get("verified"):
        return jsonify({"error": "Please complete verification first"}), 400

    email = session.get("pending_email")
    first_name = session.get("pending_first_name")
    last_name = session.get("pending_last_name")
    password = session.get("pending_password")

    try:
        birthday = datetime.strptime(data["birthday"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    new_user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        name=f"{first_name} {last_name}",
        birthday=birthday,
        password=password
    )
    db.session.add(new_user)
    db.session.commit()

    activity = UserActivity(user_id=new_user.id, action_type="account_created")
    db.session.add(activity)
    db.session.commit()

    login_user(new_user)
    session.clear()

    return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201


@api_bp.route("/login", methods=["POST"])
def api_login():
    data = request.get_json()
    if not data or not all(k in data for k in ["email", "password"]):
        return jsonify({"error": "Missing email or password"}), 400

    email = data["email"]
    password = data["password"]

    try:
        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password, password):
            return jsonify({"error": "Invalid email or password"}), 401

        login_user(user)
        activity = UserActivity(user_id=user.id, action_type="login")
        db.session.add(activity)
        db.session.commit()

        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500


@api_bp.route("/logout", methods=["POST"])
@login_required
def api_logout():
    user_id = current_user.id
    activity = UserActivity(user_id=user_id, action_type="logout")
    db.session.add(activity)
    db.session.commit()

    session.clear()
    logout_user()
    return jsonify({"message": "Logout successful"}), 200


@api_bp.route("/user", methods=["GET"])
@login_required
def api_get_user():
    return jsonify({
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "user_rank": current_user.user_rank,
            "progress": current_user.progress
        }
    }), 200
