"""Notification API: FCM tokens, history, role-targeted send."""
from flask import Blueprint, jsonify, request

try:
    from ..notification_service import (
        ensure_tables, list_notifications, mark_read, notify_event,
        register_token, status_info, unread_count, unregister_token,
    )
except ImportError:
    from backend.notification_service import (
        ensure_tables, list_notifications, mark_read, notify_event,
        register_token, status_info, unread_count, unregister_token,
    )

notifications_bp = Blueprint("notifications_bp", __name__)

@notifications_bp.route("/notifications/status", methods=["GET"])
def notif_status():
    ensure_tables()
    info = status_info()
    info["status"] = "ok" if info.get("firebase_admin_configured") else "misconfigured"
    return jsonify(info)

@notifications_bp.route("/notifications/config", methods=["GET"])
def public_firebase_config():
    import os
    cfg = {
        "apiKey": os.environ.get("FIREBASE_API_KEY") or "",
        "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN") or "",
        "projectId": os.environ.get("FIREBASE_PROJECT_ID") or "",
        "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET") or "",
        "messagingSenderId": os.environ.get("FIREBASE_MESSAGING_SENDER_ID") or "",
        "appId": os.environ.get("FIREBASE_APP_ID") or "",
        "vapidKey": os.environ.get("FIREBASE_VAPID_KEY") or "",
    }
    configured = bool(cfg["apiKey"] and cfg["projectId"] and cfg["messagingSenderId"] and cfg["appId"])
    return jsonify({"status": "success" if configured else "missing_config", "config": cfg, "configured": configured})

@notifications_bp.route("/notifications/register-token", methods=["POST"])
def api_register_token():
    data = request.get_json() or {}
    result = register_token(
        data.get("user_id") or data.get("userId") or "anonymous",
        data.get("token") or "",
        data.get("role") or "",
        request.headers.get("User-Agent", ""),
    )
    if not result.get("ok"):
        return jsonify({"status": "error", "message": result.get("error")}), 400
    return jsonify({"status": "success"})

@notifications_bp.route("/notifications/unregister-token", methods=["POST"])
def api_unregister_token():
    data = request.get_json() or {}
    if data.get("token"):
        unregister_token(data["token"])
    return jsonify({"status": "success"})

@notifications_bp.route("/notifications", methods=["GET"])
def api_list():
    user_id = request.args.get("user_id")
    limit = min(int(request.args.get("limit") or 50), 100)
    items = list_notifications(user_id=user_id, limit=limit)
    return jsonify({"status": "success", "count": len(items), "unread": unread_count(user_id), "data": items})

@notifications_bp.route("/notifications/<int:notif_id>/read", methods=["POST"])
def api_mark_read(notif_id):
    return jsonify({"status": "success" if mark_read(notif_id) else "error"})

@notifications_bp.route("/notifications/unread-count", methods=["GET"])
def api_unread():
    return jsonify({"status": "success", "count": unread_count(request.args.get("user_id"))})

@notifications_bp.route("/notifications/send", methods=["POST"])
def api_send():
    data = request.get_json() or {}
    message = data.get("message") or data.get("body") or ""
    if not message:
        return jsonify({"status": "error", "message": "message required"}), 400
    result = notify_event(
        title=data.get("title") or "SmartRoute Alert",
        message=message,
        notification_type=data.get("type") or data.get("notification_type") or "ALERT",
        severity=data.get("severity") or "MEDIUM",
        link=data.get("link") or "/alerts.html",
        event_key=data.get("event_key") or data.get("event_id"),
        roles=data.get("roles"),
        user_ids=data.get("user_ids"),
        force=bool(data.get("force")),
    )
    return jsonify(result)
