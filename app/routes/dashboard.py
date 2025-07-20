from flask import Blueprint, render_template, session, redirect, url_for
from app.models import User

bp = Blueprint('dashboard', __name__)

@bp.route('/dashboard')
def dashboard():
    user_id = session.get('user_id')
    guest = session.get('guest', False)

    if user_id:
        user = User.query.get(user_id)
        if user:
            return render_template('dashboard.html', username=user.name, is_guest=guest)

    return redirect(url_for('auth.login'))