"""
SmartRoute Flask Main Application
Integrates REST API blueprints, CORS middleware, SQLite initialization,
and frontend static asset serving.
"""

import os
import sys
import time
from pathlib import Path

# Ensure root directory is on Python path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

try:
    from .database import init_db, query_db
    from .seed_data import seed_database
    from .routes.roads_bp import roads_bp
    from .routes.incidents_bp import incidents_bp
    from .routes.vehicles_bp import vehicles_bp
    from .routes.deliveries_bp import deliveries_bp
    from .routes.officers_bp import officers_bp
    from .routes.districts_bp import districts_bp
    from .routes.infrastructure_bp import infrastructure_bp
    from .routes.reports_bp import reports_bp
    from .routes.ai_bp import ai_bp
    from .routes.simulation_bp import simulation_bp
except ImportError:
    from backend.database import init_db, query_db
    from backend.seed_data import seed_database
    from backend.routes.roads_bp import roads_bp
    from backend.routes.incidents_bp import incidents_bp
    from backend.routes.vehicles_bp import vehicles_bp
    from backend.routes.deliveries_bp import deliveries_bp
    from backend.routes.officers_bp import officers_bp
    from backend.routes.districts_bp import districts_bp
    from backend.routes.infrastructure_bp import infrastructure_bp
    from backend.routes.reports_bp import reports_bp
    from backend.routes.ai_bp import ai_bp
    from backend.routes.simulation_bp import simulation_bp

START_TIME = time.time()
FRONTEND_DIR = Path(__file__).resolve().parent.parent

def create_app():
    """Application factory for SmartRoute backend."""
    app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
    
    # Enable CORS for all routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Auto-initialize and seed DB
    init_db()
    seed_database()

    # Register Blueprints with /api prefix
    app.register_blueprint(roads_bp, url_prefix="/api")
    app.register_blueprint(incidents_bp, url_prefix="/api")
    app.register_blueprint(vehicles_bp, url_prefix="/api")
    app.register_blueprint(deliveries_bp, url_prefix="/api")
    app.register_blueprint(officers_bp, url_prefix="/api")
    app.register_blueprint(districts_bp, url_prefix="/api")
    app.register_blueprint(infrastructure_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")
    app.register_blueprint(ai_bp, url_prefix="/api")
    app.register_blueprint(simulation_bp, url_prefix="/api")

    @app.route("/api/health", methods=["GET"])
    def healthcheck():
        """Health check endpoint providing runtime diagnostics."""
        uptime_sec = int(time.time() - START_TIME)
        try:
            db_check = query_db("SELECT COUNT(*) as c FROM roads;", one=True)
            db_status = "healthy"
            total_roads = db_check["c"] if db_check else 0
        except Exception as e:
            db_status = f"error: {str(e)}"
            total_roads = 0

        return jsonify({
            "status": "healthy",
            "service": "SmartRoute Emergency Command Backend",
            "version": "1.0.0",
            "database": db_status,
            "tracked_roads": total_roads,
            "uptime_seconds": uptime_sec,
            "api_endpoints": [
                "/api/roads",
                "/api/incidents",
                "/api/vehicles",
                "/api/deliveries",
                "/api/officers",
                "/api/districts",
                "/api/infrastructure",
                "/api/reports",
                "/api/ai/predict-route",
                "/api/ai/analyze-photo",
                "/api/ai/command",
                "/api/simulation/phases"
            ]
        })

    # Serve Frontend HTML, CSS, JS
    @app.route("/", methods=["GET"])
    def serve_index():
        return send_from_directory(str(FRONTEND_DIR), "index.html")

    @app.route("/<path:filename>", methods=["GET"])
    def serve_static_page(filename):
        target = FRONTEND_DIR / filename
        if target.exists() and target.is_file():
            return send_from_directory(str(FRONTEND_DIR), filename)
        elif (FRONTEND_DIR / f"{filename}.html").exists():
            return send_from_directory(str(FRONTEND_DIR), f"{filename}.html")
        return jsonify({"status": "error", "message": "File not found"}), 404

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"status": "error", "message": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({"status": "error", "message": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=False)
