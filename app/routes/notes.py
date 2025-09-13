from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models import Note, log_user_activity
from app import db

bp = Blueprint('notes', __name__, url_prefix='/api/notes')

@bp.route('/', methods=['GET'])
@login_required
def get_notes():
    notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.created_at.desc()).all()
    
    result = []
    for note in notes:
        result.append({
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'created_at': note.created_at.isoformat()
        })
    
    return jsonify(result)

@bp.route('/<int:note_id>', methods=['GET'])
@login_required
def get_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first()
    
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    return jsonify({
        'id': note.id,
        'title': note.title,
        'content': note.content,
        'created_at': note.created_at.isoformat()
    })

@bp.route('/', methods=['POST'])
@login_required
def create_note():
    data = request.get_json()
    
    if not data or not all(k in data for k in ['title', 'content']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    new_note = Note(
        user_id=current_user.id,
        title=data['title'],
        content=data['content']
    )
    
    db.session.add(new_note)
    db.session.commit()
    
    # Log this activity for user progress
    log_user_activity(current_user.id, 'post')
    
    return jsonify({
        'message': 'Note created successfully',
        'id': new_note.id
    }), 201

@bp.route('/<int:note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first()
    
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if 'title' in data:
        note.title = data['title']
    
    if 'content' in data:
        note.content = data['content']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Note updated successfully'
    })

@bp.route('/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first()
    
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    db.session.delete(note)
    db.session.commit()
    
    return jsonify({
        'message': 'Note deleted successfully'
    })
