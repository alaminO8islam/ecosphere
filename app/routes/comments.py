from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models import Article, ArticleComment, ArticleCommentReply, Notification, User
from app import db
from datetime import datetime

bp = Blueprint('comments', __name__, url_prefix='/api/comments')

# Get all comments for an article
@bp.route('/article/<int:article_id>', methods=['GET'])
def get_article_comments(article_id):
    article = Article.query.get(article_id)
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    comments = ArticleComment.query.filter_by(article_id=article_id).order_by(ArticleComment.created_at.desc()).all()
    result = [comment.to_dict() for comment in comments]
    
    return jsonify(result)

# Create a new comment for an article
@bp.route('/article/<int:article_id>', methods=['POST'])
@login_required
def create_article_comment(article_id):
    article = Article.query.get(article_id)
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({'error': 'Content is required'}), 400
    
    # Check content length limit (100 words)
    if len(data['content'].split()) > 100:
        return jsonify({'error': 'Comment cannot exceed 100 words'}), 400
    
    comment = ArticleComment(
        article_id=article_id,
        user_id=current_user.id,
        content=data['content']
    )
    
    db.session.add(comment)
    db.session.commit()
    
    # Create notification for article owner if it's not the current user
    if article.user_id != current_user.id:
        notification = Notification(
            user_id=article.user_id,
            title="New Comment",
            message=f"{current_user.name} commented on your article: {article.title}",
            is_read=False
        )
        db.session.add(notification)
        db.session.commit()
    
    return jsonify(comment.to_dict()), 201

# Create a reply to a comment
@bp.route('/reply/<int:comment_id>', methods=['POST'])
@login_required
def create_comment_reply(comment_id):
    comment = ArticleComment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404
    
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({'error': 'Content is required'}), 400
    
    # Check content length limit (100 words)
    if len(data['content'].split()) > 100:
        return jsonify({'error': 'Reply cannot exceed 100 words'}), 400
    
    reply = ArticleCommentReply(
        comment_id=comment_id,
        user_id=current_user.id,
        content=data['content']
    )
    
    db.session.add(reply)
    db.session.commit()
    
    # Create notification for comment owner if it's not the current user
    if comment.user_id != current_user.id:
        notification = Notification(
            user_id=comment.user_id,
            title="New Reply",
            message=f"{current_user.name} replied to your comment",
            is_read=False
        )
        db.session.add(notification)
        db.session.commit()
    
    return jsonify(reply.to_dict()), 201

# Delete a comment (only owner can delete)
@bp.route('/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    comment = ArticleComment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404
    
    if comment.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(comment)
    db.session.commit()
    
    return jsonify({'message': 'Comment deleted successfully'})

# Delete a reply (only owner can delete)
@bp.route('/reply/<int:reply_id>', methods=['DELETE'])
@login_required
def delete_reply(reply_id):
    reply = ArticleCommentReply.query.get(reply_id)
    if not reply:
        return jsonify({'error': 'Reply not found'}), 404
    
    if reply.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(reply)
    db.session.commit()
    
    return jsonify({'message': 'Reply deleted successfully'})