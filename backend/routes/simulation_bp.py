"""
Disaster Simulation 18-Phase State Machine API Blueprint
"""

from flask import Blueprint, jsonify, request
from ..database import execute_db
from ..seed_data import seed_database

simulation_bp = Blueprint("simulation_bp", __name__)

PHASES = [
    {"phase": 1, "title": "Precipitation Alert", "desc": "Rainfall sensors detect 78mm accumulation in Narsipatnam sector."},
    {"phase": 2, "title": "Terrain Analysis", "desc": "AI spatial model calculates 82% ground saturation index on SH-39 pass."},
    {"phase": 3, "title": "Flood Escalation", "desc": "Local stream gauges report water levels crossing danger marks."},
    {"phase": 4, "title": "Road Degradation", "desc": "SH-39 color transitions green -> yellow -> orange -> red."},
    {"phase": 5, "title": "Flood Inundation", "desc": "3D flood water emerges surrounding KM 44 causeway."},
    {"phase": 6, "title": "Obstruction Marker", "desc": "Floating 3D warning beacon appears at SH-39 KM 48."},
    {"phase": 7, "title": "Critical Alert Broadcast", "desc": "Regional emergency alert broadcast across emergency dashboard."},
    {"phase": 8, "title": "Vehicle Threat Detection", "desc": "Medicine convoy VH-001 identified 4km from active landslide."},
    {"phase": 9, "title": "Alternate Route Computation", "desc": "AI computes 3 alternative corridors via Chintapalle, Koyyuru, and Paderu North."},
    {"phase": 10, "title": "Optimal Route Highlight", "desc": "Route A via Chintapalle (SH-34) selected with 28/100 risk index."},
    {"phase": 11, "title": "Convoy Diversion", "desc": "Automated rerouting telemetry dispatched to VH-001 driver HUD."},
    {"phase": 12, "title": "ETA Recalculation", "desc": "Convoy arrival updated to 15:45 (saving 1h 45m delay)."},
    {"phase": 13, "title": "Field Officer Verification", "desc": "FO-042 Ravi Kumar confirms blockage via GPS-tagged field report."},
    {"phase": 14, "title": "Vision AI Damage Appraisal", "desc": "Computer Vision model evaluates photo: 92.4% damage, 45.8 m³ debris."},
    {"phase": 15, "title": "Dashboard Status Sync", "desc": "All connected command center consoles synchronize telemetry."},
    {"phase": 16, "title": "NDRF Clearance Assigned", "desc": "NDRF Unit-7 heavy earthmovers dispatched to KM 48."},
    {"phase": 17, "title": "Analytics Recalibration", "desc": "Regional accessibility metrics recalibrated from 42% -> 58%."},
    {"phase": 18, "title": "Incident Clearance & Recovery", "desc": "Debris cleared, SH-39 pass restored to green operational status."}
]

@simulation_bp.route("/simulation/phases", methods=["GET"])
def get_phases():
    """Retrieve full catalog of 18 simulation demo phases."""
    return jsonify({"status": "success", "total_phases": len(PHASES), "data": PHASES})

@simulation_bp.route("/simulation/phase/<int:num>", methods=["POST"])
def trigger_phase(num):
    """Trigger state mutation corresponding to a specific simulation phase."""
    if num < 1 or num > len(PHASES):
        return jsonify({"status": "error", "message": "Invalid phase number"}), 400

    phase = PHASES[num - 1]

    if num == 4:
        execute_db("UPDATE roads SET status = 'blocked', risk_score = 86 WHERE code = 'SH-39';")
    elif num == 11:
        execute_db("UPDATE vehicles SET route_id = 'SH-34 (via Chintapalle)', status = 'on-route' WHERE code = 'VH-001';")
    elif num == 18:
        execute_db("UPDATE roads SET status = 'safe', risk_score = 15 WHERE code = 'SH-39';")
        execute_db("UPDATE incidents SET status = 'Resolved' WHERE code = 'INC-001';")

    return jsonify({
        "status": "success",
        "phase": num,
        "data": phase
    })

@simulation_bp.route("/simulation/reset", methods=["POST"])
def reset_simulation():
    """Reset entire simulation to default baseline."""
    seed_database()
    execute_db("UPDATE roads SET status = 'blocked', risk_score = 86 WHERE code = 'SH-39';")
    return jsonify({"status": "success", "message": "Simulation environment reset to initial baseline."})
