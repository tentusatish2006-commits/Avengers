"""
Incidents and Alerts API Blueprint
"""

import json
from flask import Blueprint, jsonify, request
from ..database import query_db, execute_db

incidents_bp = Blueprint("incidents_bp", __name__)

@incidents_bp.route("/incidents", methods=["GET"])
def get_incidents():
    """Retrieve all active incidents with timeline data."""
    rows = query_db("SELECT * FROM incidents ORDER BY id DESC;")
    for r in rows:
        try:
            r["timeline"] = json.loads(r["timeline_json"]) if r["timeline_json"] else []
        except Exception:
            r["timeline"] = []
    return jsonify({"status": "success", "count": len(rows), "data": rows})

@incidents_bp.route("/incidents/<code>", methods=["GET"])
def get_incident(code):
    """Retrieve single incident by code."""
    row = query_db("SELECT * FROM incidents WHERE code = ? OR id = ?;", (code, code), one=True)
    if not row:
        return jsonify({"status": "error", "message": "Incident not found"}), 404
    try:
        row["timeline"] = json.loads(row["timeline_json"]) if row["timeline_json"] else []
    except Exception:
        row["timeline"] = []
    return jsonify({"status": "success", "data": row})

@incidents_bp.route("/incidents", methods=["POST"])
def report_incident():
    """Report a new incident from field officers or automatic sensors."""
    data = request.get_json() or {}
    title = data.get("title") or "Field Incident"
    inc_type = data.get("type") or "Road Hazard"
    severity = data.get("severity") or "medium"
    lat = float(data.get("lat") or 18.0833)
    lng = float(data.get("lng") or 82.6667)
    road_name = data.get("road_name") or data.get("road") or "State Highway"
    desc = data.get("description") or "Field officer visual confirmation."
    reported_by = data.get("officer") or data.get("reported_by") or "FO-042"

    # Generate next code
    count = query_db("SELECT COUNT(*) as c FROM incidents;", one=True)["c"]
    code = f"INC-{count + 9:03d}"

    timeline = [
        {"title": "Reported (Officer)", "time": "Just now", "done": True},
        {"title": "Verified (AI Vision)", "time": "Pending", "done": False},
        {"title": "Dispatch Assigned", "time": "Pending", "done": False}
    ]

    execute_db("""
    INSERT INTO incidents (code, title, type, severity, status, lat, lng, road_code, road_name, description, detected_time, reported_by, timeline_json)
    VALUES (?, ?, ?, ?, 'Active', ?, ?, 'SH-39', ?, ?, 'Just now', ?, ?);
    """, (code, title, inc_type, severity, lat, lng, road_name, desc, reported_by, json.dumps(timeline)))

    # Also log into reports table
    rep_count = query_db("SELECT COUNT(*) as c FROM reports;", one=True)["c"]
    rep_code = f"RPT-{rep_count + 2090}"
    execute_db("""
    INSERT INTO reports (code, incident, location, officer_code, timestamp, severity, status, district, coords, description)
    VALUES (?, ?, ?, ?, 'Just now', ?, 'Open', 'Alluri Sitharama Raju', ?, ?);
    """, (rep_code, title, road_name, reported_by, severity.capitalize(), f"{lat:.4f}° N, {lng:.4f}° E", desc))

    # Also auto-create alert in alerts table so Alerts update automatically
    alt_count = query_db("SELECT COUNT(*) as c FROM alerts;", one=True)["c"]
    alt_code = f"ALT-{alt_count + 10:03d}"
    execute_db("""
    INSERT INTO alerts (code, title, severity, message, road_code, timestamp, acknowledged)
    VALUES (?, ?, ?, ?, 'SH-39', 'Just now', 0);
    """, (alt_code, f"INCIDENT: {title}", severity.lower(), f"{inc_type} at {road_name} — {desc}"))

    return jsonify({
        "status": "success",
        "message": "Incident successfully reported and entered into emergency dispatch queue.",
        "incident_code": code,
        "report_code": rep_code
    }), 201

@incidents_bp.route("/incidents/<code>/timeline", methods=["POST", "PUT"])
def advance_timeline(code):
    """Advance the response timeline step for an incident."""
    row = query_db("SELECT * FROM incidents WHERE code = ? OR id = ?;", (code, code), one=True)
    if not row:
        return jsonify({"status": "error", "message": "Incident not found"}), 404

    timeline = json.loads(row["timeline_json"]) if row["timeline_json"] else []
    data = request.get_json() or {}
    step_title = data.get("step")

    for item in timeline:
        if not item.get("done"):
            item["done"] = True
            item["time"] = "Completed"
            break

    execute_db("UPDATE incidents SET timeline_json = ? WHERE id = ?;", (json.dumps(timeline), row["id"]))
    return jsonify({"status": "success", "data": timeline})

@incidents_bp.route("/alerts", methods=["GET"])
def get_alerts():
    """Retrieve broadcast emergency alerts."""
    alerts = query_db("SELECT * FROM alerts ORDER BY id DESC;")
    return jsonify({"status": "success", "count": len(alerts), "data": alerts})

@incidents_bp.route("/alerts/<code>/ack", methods=["POST", "PUT"])
def acknowledge_alert(code):
    """Acknowledge an emergency broadcast alert."""
    execute_db("UPDATE alerts SET acknowledged = 1 WHERE code = ? OR id = ?;", (code, code))
    return jsonify({"status": "success", "message": f"Alert {code} acknowledged."})
