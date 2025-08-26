from flask import Blueprint, request, jsonify, session
from app.models import Note
from app import db

bp = Blueprint("notes", __name__)

@bp.route("/notes", methods=["POST"])
def add_note():
    data = request.json
    user_id = session.get("user_id")
    note = Note(user_id=user_id, content=data.get("content"))
    db.session.add(note)
    db.session.commit()
    return jsonify({"message": "Note added"})

@bp.route("/notes", methods=["GET"])
def list_notes():
    user_id = session.get("user_id")
    notes = Note.query.filter_by(user_id=user_id).all()
    return jsonify([{"id": n.id, "content": n.content} for n in notes])
