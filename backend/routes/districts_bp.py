"""
Districts and Regional Monitoring API Blueprint
"""

import json
from flask import Blueprint, jsonify
from ..database import query_db

districts_bp = Blueprint("districts_bp", __name__)

@districts_bp.route("/districts", methods=["GET"])
def get_districts():
    """Retrieve all monitored administrative districts and their risk scores."""
    districts = query_db("SELECT * FROM districts ORDER BY risk_score DESC;")
    for d in districts:
        try:
            d["coords"] = json.loads(d["coords_json"])
        except Exception:
            d["coords"] = []
    return jsonify({"status": "success", "count": len(districts), "data": districts})

@districts_bp.route("/districts/<name>", methods=["GET"])
def get_district(name):
    """Retrieve details for a specific district."""
    d = query_db("SELECT * FROM districts WHERE name LIKE ? OR id = ?;", (f"%{name}%", name), one=True)
    if not d:
        return jsonify({"status": "error", "message": "District not found"}), 404
    try:
        d["coords"] = json.loads(d["coords_json"])
    except Exception:
        d["coords"] = []
    return jsonify({"status": "success", "data": d})
