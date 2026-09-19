"""
Shared Users API — admin-added and signup users persist in SQLite
so they appear on any machine that talks to the same backend.
"""

from flask import Blueprint, jsonify, request
from ..database import query_db, execute_db

users_bp = Blueprint("users_bp", __name__)


def _row_to_user(row):
    if not row:
        return None
    return {
        "id": row.get("code") or f"USR-{row.get('id')}",
        "code": row.get("code"),
        "name": row.get("name"),
        "username": row.get("username") or row.get("name"),
        "email": row.get("email") or "",
        "password": row.get("password") or "",
        "role": row.get("role") or "Field Officer",
        "dist": row.get("district") or "HQ",
        "district": row.get("district") or "HQ",
        "stat": row.get("status") or "Active",
        "status": row.get("status") or "Active",
        "login": row.get("last_login") or "—",
        "last_login": row.get("last_login") or "—",
    }


@users_bp.route("/users", methods=["GET"])
def list_users():
    rows = query_db("SELECT * FROM users ORDER BY id ASC;")
    if not rows:
        defaults = [
            ("USR-001", "Admin Officer", "Admin Officer", "", "admin123", "Administrator", "HQ Guwahati", "Active"),
            ("USR-002", "Ravi Kumar", "Ravi Kumar", "", "Pass@123", "Field Officer", "Assam", "Active"),
            ("USR-003", "District Collector", "District Collector", "", "Pass@123", "Local Authority", "Assam", "Active"),
        ]
        for d in defaults:
            try:
                execute_db(
                    """INSERT INTO users (code, name, username, email, password, role, district, status, last_login)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], "—"),
                )
            except Exception:
                pass
        rows = query_db("SELECT * FROM users ORDER BY id ASC;")
    data = [_row_to_user(r) for r in rows]
    return jsonify({"status": "success", "count": len(data), "data": data})


@users_bp.route("/users", methods=["POST"])
def create_user():
    data = request.get_json() or {}
    name = (data.get("name") or data.get("username") or "").strip()
    if not name:
        return jsonify({"status": "error", "message": "name required"}), 400

    code = (data.get("code") or data.get("id") or "").strip()
    if not code:
        last = query_db("SELECT code FROM users ORDER BY id DESC LIMIT 1;", one=True)
        n = 1
        if last and last.get("code"):
            import re
            m = re.search(r"(\d+)", last["code"])
            if m:
                n = int(m.group(1)) + 1
        code = f"USR-{n:03d}"

    existing = query_db(
        "SELECT id FROM users WHERE code = ? OR username = ? OR name = ?;",
        (code, name, name),
        one=True,
    )
    role = data.get("role") or "Field Officer"
    district = data.get("district") or data.get("dist") or "HQ"
    status = data.get("status") or data.get("stat") or "Active"
    password = data.get("password") or "changeme"
    email = data.get("email") or ""
    username = data.get("username") or name
    last_login = data.get("login") or data.get("last_login") or "Just now"

    if existing:
        execute_db(
            """
            UPDATE users SET name=?, username=?, email=?, password=?, role=?,
            district=?, status=?, last_login=? WHERE id=?
            """,
            (name, username, email, password, role, district, status, last_login, existing["id"]),
        )
    else:
        execute_db(
            """
            INSERT INTO users (code, name, username, email, password, role, district, status, last_login)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (code, name, username, email, password, role, district, status, last_login),
        )

    row = query_db("SELECT * FROM users WHERE code = ?;", (code,), one=True)
    return jsonify({"status": "success", "data": _row_to_user(row)})


@users_bp.route("/users/<code>", methods=["PUT", "PATCH"])
def update_user(code):
    data = request.get_json() or {}
    row = query_db("SELECT * FROM users WHERE code = ? OR id = ?;", (code, code), one=True)
    if not row:
        return jsonify({"status": "error", "message": "User not found"}), 404

    name = data.get("name", row.get("name"))
    username = data.get("username", row.get("username") or name)
    email = data.get("email", row.get("email") or "")
    password = data.get("password", row.get("password") or "")
    role = data.get("role", row.get("role"))
    district = data.get("district") or data.get("dist") or row.get("district")
    status = data.get("status") or data.get("stat") or row.get("status")
    last_login = data.get("login") or data.get("last_login") or row.get("last_login")

    execute_db(
        """
        UPDATE users SET name=?, username=?, email=?, password=?, role=?,
        district=?, status=?, last_login=? WHERE id=?
        """,
        (name, username, email, password, role, district, status, last_login, row["id"]),
    )
    updated = query_db("SELECT * FROM users WHERE id = ?;", (row["id"],), one=True)
    return jsonify({"status": "success", "data": _row_to_user(updated)})


@users_bp.route("/users/<code>", methods=["DELETE"])
def delete_user(code):
    row = query_db("SELECT * FROM users WHERE code = ? OR id = ?;", (code, code), one=True)
    if not row:
        return jsonify({"status": "error", "message": "User not found"}), 404
    execute_db("DELETE FROM users WHERE id = ?;", (row["id"],))
    return jsonify({"status": "success", "message": "deleted"})


@users_bp.route("/users/login", methods=["POST"])
def login_user():
    data = request.get_json() or {}
    ident = (data.get("username") or data.get("email") or data.get("name") or "").strip()
    password = str(data.get("password") or "")
    if not ident or not password:
        return jsonify({"status": "error", "message": "username and password required"}), 400

    rows = query_db("SELECT * FROM users;")
    ident_l = ident.lower()
    for r in rows:
        candidates = [
            (r.get("username") or "").lower(),
            (r.get("name") or "").lower(),
            (r.get("email") or "").lower(),
            (r.get("code") or "").lower(),
        ]
        if ident_l in candidates and str(r.get("password") or "") == password:
            if (r.get("status") or "Active").lower() == "inactive":
                return jsonify({"status": "error", "message": "Account inactive"}), 403
            execute_db(
                "UPDATE users SET last_login = ? WHERE id = ?;",
                ("Just now", r["id"]),
            )
            return jsonify({"status": "success", "data": _row_to_user(r)})
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401
