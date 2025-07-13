from flask import Blueprint, jsonify, request, session
from ..models import db, Note

bp = Blueprint('notes', __name__, url_prefix='/api/notes')

@bp.route('/', methods=['GET'])
def get_notes():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    notes = Note.query.filter_by(user_id=user_id).order_by(Note.created_at.desc()).all()
    return jsonify([
        {
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "created_at": n.created_at.isoformat()
        }
        for n in notes
    ])


@bp.route('/', methods=['POST'])
def add_note():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    new_note = Note(
        user_id=user_id,
        title=data.get("title"),
        content=data.get("content")
    )
    db.session.add(new_note)
    db.session.commit()
    return jsonify({"message": "Note added successfully."})


@bp.route('/delete', methods=['POST'])
def delete_note():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    note = Note.query.filter_by(id=data.get("id"), user_id=user_id).first()
    if note:
        db.session.delete(note)
        db.session.commit()
        return jsonify({"message": "Note deleted successfully."})
    else:
        return jsonify({"error": "Note not found"}), 404
