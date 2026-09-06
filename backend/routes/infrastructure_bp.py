"""
Infrastructure Assets API Blueprint
"""

import json
from flask import Blueprint, jsonify, request
from ..database import query_db, execute_db

infrastructure_bp = Blueprint("infrastructure_bp", __name__)

@infrastructure_bp.route("/infrastructure", methods=["GET"])
def get_infrastructure():
    """Retrieve all monitored bridges, tunnels, culverts, and roads."""
    infra_type = request.args.get("type")
    if infra_type and infra_type.upper() != "ALL":
        items = query_db("SELECT * FROM infrastructure WHERE UPPER(type) = ? ORDER BY risk_pct DESC;", (infra_type.upper(),))
    else:
        items = query_db("SELECT * FROM infrastructure ORDER BY risk_pct DESC;")

    for item in items:
        try:
            item["history"] = json.loads(item["history_json"]) if item["history_json"] else []
        except Exception:
            item["history"] = []

    return jsonify({"status": "success", "count": len(items), "data": items})

@infrastructure_bp.route("/infrastructure/<code>", methods=["GET"])
def get_asset(code):
    """Retrieve details for a single asset."""
    asset = query_db("SELECT * FROM infrastructure WHERE code = ? OR id = ?;", (code, code), one=True)
    if not asset:
        return jsonify({"status": "error", "message": "Asset not found"}), 404
    try:
        asset["history"] = json.loads(asset["history_json"]) if asset["history_json"] else []
    except Exception:
        asset["history"] = []
    return jsonify({"status": "success", "data": asset})

@infrastructure_bp.route("/infrastructure/<code>/condition", methods=["POST", "PUT"])
def update_condition(code):
    """Update condition evaluation for an infrastructure asset."""
    data = request.get_json() or {}
    condition = data.get("condition") or "Good"
    risk_pct = data.get("risk_pct") or 25
    color = "#00ff88" if condition in ["Good", "Excellent"] else "#ffd700" if condition == "Moderate" else "#ff9500" if condition == "Poor" else "#ff3b3b"

    execute_db("""
    UPDATE infrastructure 
    SET condition = ?, risk_pct = ?, color = ?, last_inspection = 'Just now'
    WHERE code = ? OR id = ?;
    """, (condition, risk_pct, color, code, code))

    return jsonify({"status": "success", "message": f"Asset {code} condition updated to {condition}."})

@infrastructure_bp.route("/infrastructure/<code>/schedule", methods=["POST"])
def schedule_inspection(code):
    """Schedule inspection by an engineering officer."""
    data = request.get_json() or {}
    officer_code = data.get("officer_code") or "FO-061"
    inspection_date = data.get("date") or "2026-09-08"

    asset = query_db("SELECT * FROM infrastructure WHERE code = ? OR id = ?;", (code, code), one=True)
    if not asset:
        return jsonify({"status": "error", "message": "Asset not found"}), 404

    history = json.loads(asset["history_json"]) if asset["history_json"] else []
    history.insert(0, f"{inspection_date}: Scheduled inspection by {officer_code}")

    execute_db("""
    UPDATE infrastructure 
    SET history_json = ? 
    WHERE code = ? OR id = ?;
    """, (json.dumps(history), code, code))

    return jsonify({
        "status": "success",
        "message": f"Inspection scheduled for {asset['name']} on {inspection_date} (Assigned: {officer_code})."
    })
