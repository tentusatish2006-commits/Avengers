"""SmartRoute Flask Main Application"""
import os
import sys
import time
from pathlib import Path

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
    from .routes.users_bp import users_bp
    from .routes.routing_bp import routing_bp
    from .routes.notifications_bp import notifications_bp
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
    from backend.routes.users_bp import users_bp
    from backend.routes.routing_bp import routing_bp
    from backend.routes.notifications_bp import notifications_bp

START_TIME = time.time()
FRONTEND_DIR = Path(__file__).resolve().parent.parent

def create_app():
    app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    init_db()
    seed_database()
    try:
        from .notification_service import ensure_tables as _ensure_notif
        _ensure_notif()
    except Exception:
        try:
            from backend.notification_service import ensure_tables as _ensure_notif
            _ensure_notif()
        except Exception:
            pass

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
    app.register_blueprint(users_bp, url_prefix="/api")
    app.register_blueprint(routing_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")

    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "healthy",
            "uptime_sec": int(time.time() - START_TIME),
            "service": "SmartRoute API",
            "ors_configured": bool(os.environ.get("OPENROUTESERVICE_API_KEY") or os.environ.get("ORS_API_KEY")),
        })

    @app.route("/")
    def index():
        return send_from_directory(str(FRONTEND_DIR), "index.html")

    @app.route("/<path:filename>")
    def serve_file(filename):
        if (FRONTEND_DIR / filename).is_file():
            return send_from_directory(str(FRONTEND_DIR), filename)
        elif (FRONTEND_DIR / f"{filename}.html").exists():
            return send_from_directory(str(FRONTEND_DIR), f"{filename}.html")
        return jsonify({"status": "error", "message": "File not found"}), 404

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=False)
