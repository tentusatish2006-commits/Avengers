"""SmartRoute FCM notification service — SQLite history, role targeting, duplicate prevention."""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "smartroute.db"

ROLE_TARGETS = {
    "ROUTE_RISK": ["DRIVER", "FIELD_OFFICER", "LOGISTICS_MANAGER", "ADMIN"],
    "ROAD_BLOCKED": ["DRIVER", "LOGISTICS_MANAGER", "FIELD_OFFICER", "ADMIN"],
    "LANDSLIDE": ["GOVERNMENT_OFFICER", "FIELD_OFFICER", "LOGISTICS_MANAGER", "ADMIN"],
    "FLOOD": ["GOVERNMENT_OFFICER", "FIELD_OFFICER", "DRIVER", "LOGISTICS_MANAGER", "ADMIN"],
    "SHIPMENT_DELAY": ["LOGISTICS_MANAGER", "DRIVER", "ADMIN"],
    "EMERGENCY": ["GOVERNMENT_OFFICER", "FIELD_OFFICER", "ADMIN"],
    "INCIDENT": ["GOVERNMENT_OFFICER", "FIELD_OFFICER", "LOGISTICS_MANAGER", "ADMIN"],
    "ALERT": ["ADMIN", "GOVERNMENT_OFFICER", "FIELD_OFFICER", "DRIVER", "LOGISTICS_MANAGER"],
}

def _conn():
    c = sqlite3.connect(str(DB_PATH))
    c.row_factory = sqlite3.Row
    return c

def ensure_tables():
    c = _conn()
    try:
        c.executescript("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT UNIQUE,
                user_id TEXT,
                role_target TEXT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                notification_type TEXT DEFAULT 'ALERT',
                severity TEXT DEFAULT 'MEDIUM',
                link TEXT,
                read_status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS fcm_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                role TEXT,
                token TEXT UNIQUE NOT NULL,
                user_agent TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_notif_event ON notifications(event_id);
            CREATE INDEX IF NOT EXISTS idx_fcm_user ON fcm_tokens(user_id);
        """)
        c.commit()
    finally:
        c.close()

def make_event_id(notification_type: str, key: str) -> str:
    return hashlib.sha256(f"{notification_type}:{key}".encode()).hexdigest()[:32]

def _firebase_admin_ready():
    path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    raw_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if path and Path(path).is_file():
        return True, "service_account_file"
    if raw_json and raw_json.strip().startswith("{"):
        return True, "service_account_json_env"
    return False, "missing_FIREBASE_SERVICE_ACCOUNT_PATH_or_JSON"

_firebase_app = None

def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    ready, _ = _firebase_admin_ready()
    if not ready:
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials
        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app
        path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        raw_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if path and Path(path).is_file():
            cred = credentials.Certificate(path)
        else:
            cred = credentials.Certificate(json.loads(raw_json))
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception as e:
        print("[notifications] Firebase Admin init failed:", e)
        return None

def register_token(user_id, token, role="", user_agent=""):
    ensure_tables()
    if not token or len(token) < 20:
        return {"ok": False, "error": "Invalid FCM token"}
    c = _conn()
    try:
        c.execute(
            """INSERT INTO fcm_tokens (user_id, role, token, user_agent, updated_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(token) DO UPDATE SET user_id=excluded.user_id, role=excluded.role,
                 user_agent=excluded.user_agent, updated_at=CURRENT_TIMESTAMP""",
            (user_id or "anonymous", (role or "").upper(), token, user_agent or ""),
        )
        c.commit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    finally:
        c.close()

def unregister_token(token):
    ensure_tables()
    c = _conn()
    try:
        c.execute("DELETE FROM fcm_tokens WHERE token = ?", (token,))
        c.commit()
    finally:
        c.close()

def list_tokens_for_roles(roles):
    ensure_tables()
    roles = [r.upper() for r in roles if r]
    c = _conn()
    try:
        if not roles:
            rows = c.execute("SELECT user_id, role, token FROM fcm_tokens").fetchall()
        else:
            ph = ",".join("?" * len(roles))
            rows = c.execute(
                f"SELECT user_id, role, token FROM fcm_tokens WHERE role IN ({ph}) OR role = '' OR role IS NULL",
                roles,
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        c.close()

def _already_sent(event_id):
    ensure_tables()
    c = _conn()
    try:
        return c.execute("SELECT 1 FROM notifications WHERE event_id = ? LIMIT 1", (event_id,)).fetchone() is not None
    finally:
        c.close()

def _store_notification(row):
    ensure_tables()
    c = _conn()
    try:
        cur = c.execute(
            """INSERT OR IGNORE INTO notifications
               (event_id, user_id, role_target, title, message, notification_type, severity, link, read_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)""",
            (row.get("event_id"), row.get("user_id"), row.get("role_target"), row.get("title"),
             row.get("message"), row.get("notification_type"), row.get("severity"), row.get("link")),
        )
        c.commit()
        return cur.lastrowid
    except Exception as e:
        print("[notifications] store failed:", e)
        return None
    finally:
        c.close()

def _send_fcm(tokens, title, body, data):
    app = _get_firebase_app()
    if not app:
        ready, reason = _firebase_admin_ready()
        return {"sent": 0, "failed": len(tokens),
                "error": f"Firebase Admin not configured ({reason}). Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON."}
    try:
        from firebase_admin import messaging
        success = failed = 0
        errors = []
        for token in tokens:
            try:
                msg = messaging.Message(
                    token=token,
                    notification=messaging.Notification(title=title, body=body),
                    data={k: str(v) for k, v in (data or {}).items()},
                    webpush=messaging.WebpushConfig(
                        fcm_options=messaging.WebpushFCMOptions(link=data.get("link") or "/alerts.html")
                    ),
                )
                messaging.send(msg)
                success += 1
            except Exception as e:
                failed += 1
                err = str(e)
                errors.append(err[:120])
                if "not-found" in err.lower() or "unregistered" in err.lower():
                    unregister_token(token)
        return {"sent": success, "failed": failed, "errors": errors[:5]}
    except Exception as e:
        return {"sent": 0, "failed": len(tokens), "error": str(e)}

def notify_event(*, title, message, notification_type="ALERT", severity="MEDIUM",
                 link="/alerts.html", event_key=None, roles=None, user_ids=None, force=False):
    ensure_tables()
    ntype = (notification_type or "ALERT").upper()
    event_id = make_event_id(ntype, event_key or f"{title}|{message}|{int(time.time()//300)}")
    if not force and _already_sent(event_id):
        return {"status": "duplicate", "event_id": event_id, "message": "Notification already sent for this event_id"}
    target_roles = roles or ROLE_TARGETS.get(ntype, ROLE_TARGETS["ALERT"])
    _store_notification({
        "event_id": event_id, "user_id": ",".join(user_ids) if user_ids else None,
        "role_target": ",".join(target_roles), "title": title, "message": message,
        "notification_type": ntype, "severity": (severity or "MEDIUM").upper(), "link": link or "/alerts.html",
    })
    token_rows = list_tokens_for_roles(target_roles)
    if user_ids:
        uid_set = set(user_ids)
        token_rows = [t for t in token_rows if t.get("user_id") in uid_set] or token_rows
    tokens = list({t["token"] for t in token_rows if t.get("token")})
    fcm_result = {"sent": 0, "failed": 0, "skipped": True, "reason": "no_tokens"}
    if tokens:
        fcm_result = _send_fcm(tokens, title, message, {
            "type": ntype, "severity": (severity or "MEDIUM").upper(),
            "link": link or "/alerts.html", "event_id": event_id,
        })
    return {"status": "success", "event_id": event_id, "roles": target_roles,
            "token_count": len(tokens), "fcm": fcm_result}

def list_notifications(user_id=None, limit=50):
    ensure_tables()
    c = _conn()
    try:
        if user_id:
            rows = c.execute(
                "SELECT * FROM notifications WHERE user_id IS NULL OR user_id = '' OR user_id LIKE ? ORDER BY created_at DESC LIMIT ?",
                (f"%{user_id}%", limit),
            ).fetchall()
        else:
            rows = c.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
        out = []
        for r in rows:
            d = dict(r)
            d["read_status"] = bool(d.get("read_status"))
            out.append(d)
        return out
    finally:
        c.close()

def mark_read(notif_id):
    ensure_tables()
    c = _conn()
    try:
        c.execute("UPDATE notifications SET read_status = 1 WHERE id = ?", (notif_id,))
        c.commit()
        return True
    except Exception:
        return False
    finally:
        c.close()

def unread_count(user_id=None):
    ensure_tables()
    c = _conn()
    try:
        if user_id:
            row = c.execute(
                "SELECT COUNT(*) AS c FROM notifications WHERE read_status = 0 AND (user_id IS NULL OR user_id = '' OR user_id LIKE ?)",
                (f"%{user_id}%",),
            ).fetchone()
        else:
            row = c.execute("SELECT COUNT(*) AS c FROM notifications WHERE read_status = 0").fetchone()
        return int(row["c"] if row else 0)
    finally:
        c.close()

def status_info():
    ready, reason = _firebase_admin_ready()
    return {
        "firebase_admin_configured": ready,
        "firebase_detail": reason if not ready else "ok",
        "web_config_present": bool(
            os.environ.get("FIREBASE_API_KEY") and os.environ.get("FIREBASE_PROJECT_ID")
            and os.environ.get("FIREBASE_MESSAGING_SENDER_ID") and os.environ.get("FIREBASE_APP_ID")
        ),
        "vapid_present": bool(os.environ.get("FIREBASE_VAPID_KEY")),
    }
