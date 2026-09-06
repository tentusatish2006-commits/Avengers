"""
Roads and Corridors API Blueprint
"""

import json
from flask import Blueprint, jsonify, request
from ..database import query_db, execute_db

roads_bp = Blueprint("roads_bp", __name__)

@roads_bp.route("/roads", methods=["GET"])
def get_roads():
    """Retrieve all road segments and current accessibility status."""
    rows = query_db("SELECT * FROM roads ORDER BY risk_score DESC;")
    for r in rows:
        try:
            r["coords"] = json.loads(r["coords_json"])
        except Exception:
            r["coords"] = []
    return jsonify({"status": "success", "count": len(rows), "data": rows})

@roads_bp.route("/roads/<code>", methods=["GET"])
def get_road_by_code(code):
    """Retrieve details for a specific road code or ID."""
    row = query_db("SELECT * FROM roads WHERE code = ? OR id = ?;", (code, code), one=True)
    if not row:
        return jsonify({"status": "error", "message": "Road not found"}), 404
    try:
        row["coords"] = json.loads(row["coords_json"])
    except Exception:
        row["coords"] = []
    return jsonify({"status": "success", "data": row})

@roads_bp.route("/roads/<code>/status", methods=["POST", "PUT"])
def update_road_status(code):
    """Update accessibility status and risk score for a road segment."""
    data = request.get_json() or {}
    new_status = data.get("status")
    new_risk = data.get("risk_score")
    new_condition = data.get("condition")

    row = query_db("SELECT * FROM roads WHERE code = ? OR id = ?;", (code, code), one=True)
    if not row:
        return jsonify({"status": "error", "message": "Road not found"}), 404

    target_code = row["code"]
    status = new_status if new_status is not None else row["status"]
    risk = new_risk if new_risk is not None else row["risk_score"]
    condition = new_condition if new_condition is not None else row["condition"]

    execute_db(
        "UPDATE roads SET status = ?, risk_score = ?, condition = ?, updated_at = CURRENT_TIMESTAMP WHERE code = ?;",
        (status, risk, condition, target_code)
    )

    updated = query_db("SELECT * FROM roads WHERE code = ?;", (target_code,), one=True)
    try:
        updated["coords"] = json.loads(updated["coords_json"])
    except Exception:
        updated["coords"] = []

    return jsonify({"status": "success", "message": "Road status updated", "data": updated})

@roads_bp.route("/corridors", methods=["GET"])
def get_corridors():
    """Retrieve high-risk corridor segments for risk analysis."""
    corridors = [
        {"name": "Paderu – Araku Valley", "risk": 86, "level": "CRITICAL", "cause": "Active Landslide + Flood", "incidents": 3, "vehicles": 2, "coords": [18.08, 82.66]},
        {"name": "Chintapalle – Araku", "risk": 79, "level": "HIGH", "cause": "Road damage + Rain", "incidents": 2, "vehicles": 0, "coords": [17.87, 82.35]},
        {"name": "Narsipatnam – Paderu", "risk": 72, "level": "HIGH", "cause": "Flash flood", "incidents": 1, "vehicles": 0, "coords": [17.67, 82.61]},
        {"name": "GK Veedhi – Paderu", "risk": 65, "level": "MODERATE", "cause": "Construction", "incidents": 0, "vehicles": 0, "coords": [17.89, 82.17]},
        {"name": "Vizag – Narsipatnam", "risk": 48, "level": "MODERATE", "cause": "Heavy traffic", "incidents": 1, "vehicles": 0, "coords": [17.68, 83.21]},
        {"name": "Koyyuru – Chintapalle", "risk": 31, "level": "LOW", "cause": "None", "incidents": 0, "vehicles": 0, "coords": [17.66, 82.16]}
    ]
    return jsonify({"status": "success", "count": len(corridors), "data": corridors})
