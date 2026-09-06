"""
Essential Deliveries API Blueprint
"""

from flask import Blueprint, jsonify, request
from ..database import query_db, execute_db

deliveries_bp = Blueprint("deliveries_bp", __name__)

@deliveries_bp.route("/deliveries", methods=["GET"])
def get_deliveries():
    """Retrieve all monitored supply deliveries."""
    deliveries = query_db("SELECT * FROM deliveries ORDER BY id ASC;")
    return jsonify({"status": "success", "count": len(deliveries), "data": deliveries})

@deliveries_bp.route("/deliveries/categories", methods=["GET"])
def get_categories():
    """Retrieve summarized counts and risk statuses by category."""
    summary = {
        "medicines": {"count": 12, "at_risk": 2, "status": "2 at risk"},
        "food": {"count": 24, "at_risk": 0, "status": "On track"},
        "agriculture": {"count": 8, "at_risk": 1, "status": "1 blocked"},
        "construction": {"count": 15, "at_risk": 0, "status": "On track"},
        "emergency": {"count": 5, "at_risk": 1, "status": "1 critical"}
    }
    return jsonify({"status": "success", "data": summary})

@deliveries_bp.route("/deliveries/reroute", methods=["POST"])
def reroute_deliveries():
    """Execute AI dynamic detour via Chintapalle for all obstructed deliveries."""
    affected_codes = ["DEL-001", "DEL-003", "DEL-008"]
    
    execute_db("""
    UPDATE deliveries 
    SET status = 'Rerouted (On-time)', risk_level = 'Low', delay_mins = 20
    WHERE code IN ('DEL-001', 'DEL-003', 'DEL-008');
    """)

    # Also update associated vehicles
    execute_db("""
    UPDATE vehicles 
    SET status = 'on-route', speed_kmh = 48, route_id = 'SH-34 (via Chintapalle)'
    WHERE code IN ('VH-001', 'VH-003', 'VH-004');
    """)

    updated = query_db("SELECT * FROM deliveries WHERE code IN ('DEL-001', 'DEL-003', 'DEL-008');")

    return jsonify({
        "status": "success",
        "message": "AI Dynamic Reroute successfully applied to critical delivery convoys.",
        "delay_saved": "1h 45m",
        "alternate_corridor": "State Highway 34 via Chintapalle",
        "affected_deliveries": updated
    })
