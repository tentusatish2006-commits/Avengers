"""
AI Services API Blueprint
Connects to ML route risk scoring, Vision AI photo analysis, and NLP Command Assistant.
"""

from flask import Blueprint, jsonify, request
from ..ai_service import predict_route_risk, analyze_damage_photo, process_command_query

ai_bp = Blueprint("ai_bp", __name__)

@ai_bp.route("/ai/predict-route", methods=["POST"])
def api_predict_route():
    """Predict route risk score, disruption probability, and recommended detour."""
    data = request.get_json() or {}
    source = data.get("source", "Visakhapatnam Port")
    destination = data.get("destination", "Paderu")
    vehicle_type = data.get("vehicle_type", "Medicine Truck")
    priority = data.get("priority", "Critical")

    result = predict_route_risk(source, destination, vehicle_type, priority)
    return jsonify(result)

@ai_bp.route("/ai/analyze-photo", methods=["POST"])
def api_analyze_photo():
    """Computer vision inspection endpoint for road distress and terrain failures."""
    data = request.get_json() or {}
    filename = data.get("filename", "landslide_blockage.jpg")
    metadata = data.get("metadata", {})

    result = analyze_damage_photo(filename, metadata)
    return jsonify(result)

@ai_bp.route("/ai/command", methods=["POST"])
def api_ai_command():
    """Conversational AI Command assistant natural language query endpoint."""
    data = request.get_json() or {}
    query = data.get("query", "")

    result = process_command_query(query)
    return jsonify(result)
