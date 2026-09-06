"""
Field Officers and Dispatch API Blueprint
"""

from flask import Blueprint, jsonify, request
from ..database import query_db, execute_db

officers_bp = Blueprint("officers_bp", __name__)

@officers_bp.route("/officers", methods=["GET"])
def get_officers():
    """Retrieve all deployed field officers and their live GPS statuses."""
    officers = query_db("SELECT * FROM officers ORDER BY id ASC;")
    return jsonify({"status": "success", "count": len(officers), "data": officers})

@officers_bp.route("/officers/<code>", methods=["GET"])
def get_officer(code):
    """Retrieve details for a single field officer."""
    officer = query_db("SELECT * FROM officers WHERE code = ? OR id = ?;", (code, code), one=True)
    if not officer:
        return jsonify({"status": "error", "message": "Officer not found"}), 404
    return jsonify({"status": "success", "data": officer})

@officers_bp.route("/officers/<code>/assign", methods=["POST"])
def assign_incident(code):
    """Dispatch an incident to an officer."""
    data = request.get_json() or {}
    incident_code = data.get("incident_code") or "INC-001"
    note = data.get("note") or f"Dispatched to incident {incident_code}"

    officer = query_db("SELECT * FROM officers WHERE code = ? OR id = ?;", (code, code), one=True)
    if not officer:
        return jsonify({"status": "error", "message": "Officer not found"}), 404

    execute_db("""
    UPDATE officers 
    SET note = ?, reports_count = reports_count + 1, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
    WHERE code = ? OR id = ?;
    """, (note, code, code))

    updated = query_db("SELECT * FROM officers WHERE code = ? OR id = ?;", (code, code), one=True)
    return jsonify({
        "status": "success",
        "message": f"Incident {incident_code} dispatched to {officer['name']} ({officer['code']}).",
        "data": updated
    })
