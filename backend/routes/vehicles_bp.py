"""
Vehicles and Fleet Tracking API Blueprint
"""

from flask import Blueprint, jsonify, request
from ..database import query_db, execute_db

vehicles_bp = Blueprint("vehicles_bp", __name__)

@vehicles_bp.route("/vehicles", methods=["GET"])
def get_vehicles():
    """Retrieve real-time GPS locations and statuses for all tracked fleet vehicles."""
    vehicles = query_db("SELECT * FROM vehicles ORDER BY id ASC;")
    return jsonify({"status": "success", "count": len(vehicles), "data": vehicles})

@vehicles_bp.route("/vehicles/<code>", methods=["GET"])
def get_vehicle(code):
    """Retrieve details for a specific vehicle."""
    v = query_db("SELECT * FROM vehicles WHERE code = ? OR id = ?;", (code, code), one=True)
    if not v:
        return jsonify({"status": "error", "message": "Vehicle not found"}), 404
    return jsonify({"status": "success", "data": v})

@vehicles_bp.route("/vehicles/<code>/reroute", methods=["POST", "PUT"])
def reroute_vehicle(code):
    """Update vehicle route trajectory to safe alternate corridor."""
    data = request.get_json() or {}
    new_route = data.get("route") or "SH-34 (via Chintapalle)"
    new_eta = data.get("eta") or "15:45"

    execute_db("""
    UPDATE vehicles 
    SET status = 'on-route', route_id = ?, eta = ?, speed_kmh = 45, updated_at = CURRENT_TIMESTAMP
    WHERE code = ? OR id = ?;
    """, (new_route, new_eta, code, code))

    updated = query_db("SELECT * FROM vehicles WHERE code = ? OR id = ?;", (code, code), one=True)
    return jsonify({"status": "success", "message": f"Vehicle {code} rerouted via {new_route}", "data": updated})

@vehicles_bp.route("/vehicles/<code>/gps", methods=["POST", "PUT"])
def update_gps(code):
    """Update vehicle live GPS coordinates."""
    data = request.get_json() or {}
    lat = data.get("lat")
    lng = data.get("lng")
    speed = data.get("speed_kmh", 45)
    heading = data.get("heading", 0.0)

    if lat is None or lng is None:
        return jsonify({"status": "error", "message": "lat and lng required"}), 400

    execute_db("""
    UPDATE vehicles 
    SET lat = ?, lng = ?, speed_kmh = ?, heading = ?, updated_at = CURRENT_TIMESTAMP
    WHERE code = ? OR id = ?;
    """, (lat, lng, speed, heading, code, code))

    return jsonify({"status": "success", "message": "GPS coordinates updated"})
