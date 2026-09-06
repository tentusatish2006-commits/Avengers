"""
SmartRoute Comprehensive Backend Test Suite
Tests all REST API endpoints, database operations, and AI intelligence services.
"""

import sys
import json
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app import create_app
from backend.database import init_db
from backend.seed_data import seed_database

def run_tests():
    print("=" * 60)
    print("  SMARTROUTE BACKEND TEST SUITE")
    print("=" * 60)

    # Initialize test client
    init_db()
    seed_database()
    app = create_app()
    client = app.test_client()

    passed = 0
    failed = 0

    def check(endpoint_name, condition, details=""):
        nonlocal passed, failed
        if condition:
            print(f"  [PASS] {endpoint_name}")
            passed += 1
        else:
            print(f"  [FAIL] {endpoint_name} — {details}")
            failed += 1

    # 1. Healthcheck
    res = client.get("/api/health")
    data = res.get_json() or {}
    check("GET /api/health", res.status_code == 200 and data.get("status") == "healthy")

    # 2. Roads
    res = client.get("/api/roads")
    data = res.get_json() or {}
    check("GET /api/roads", res.status_code == 200 and len(data.get("data", [])) >= 6)

    # 3. Update Road Status
    res = client.post("/api/roads/SH-39/status", json={"status": "warning", "risk_score": 75})
    data = res.get_json() or {}
    check("POST /api/roads/SH-39/status", res.status_code == 200 and data.get("data", {}).get("status") == "warning")

    # 4. Corridors
    res = client.get("/api/corridors")
    data = res.get_json() or {}
    check("GET /api/corridors", res.status_code == 200 and len(data.get("data", [])) >= 6)

    # 5. Incidents
    res = client.get("/api/incidents")
    data = res.get_json() or {}
    check("GET /api/incidents", res.status_code == 200 and len(data.get("data", [])) >= 4)

    # 6. Report Incident
    new_inc = {
        "title": "Road Fissure at Chintapalle",
        "type": "Road Hazard",
        "severity": "medium",
        "lat": 17.87,
        "lng": 82.35,
        "road": "SH-34",
        "description": "5-meter lateral surface tear.",
        "officer": "FO-042"
    }
    res = client.post("/api/incidents", json=new_inc)
    data = res.get_json() or {}
    check("POST /api/incidents", res.status_code == 201 and "incident_code" in data)

    # 7. Alerts
    res = client.get("/api/alerts")
    data = res.get_json() or {}
    check("GET /api/alerts", res.status_code == 200 and len(data.get("data", [])) >= 4)

    # 8. Acknowledge Alert
    res = client.post("/api/alerts/ALT-001/ack")
    data = res.get_json() or {}
    check("POST /api/alerts/ALT-001/ack", res.status_code == 200)

    # 9. Vehicles
    res = client.get("/api/vehicles")
    data = res.get_json() or {}
    check("GET /api/vehicles", res.status_code == 200 and len(data.get("data", [])) >= 6)

    # 10. Reroute Vehicle
    res = client.post("/api/vehicles/VH-001/reroute", json={"route": "SH-34 (via Chintapalle)", "eta": "15:45"})
    data = res.get_json() or {}
    check("POST /api/vehicles/VH-001/reroute", res.status_code == 200 and data.get("data", {}).get("route_id") == "SH-34 (via Chintapalle)")

    # 11. Deliveries
    res = client.get("/api/deliveries")
    data = res.get_json() or {}
    check("GET /api/deliveries", res.status_code == 200 and len(data.get("data", [])) >= 8)

    # 12. Reroute Deliveries
    res = client.post("/api/deliveries/reroute")
    data = res.get_json() or {}
    check("POST /api/deliveries/reroute", res.status_code == 200 and len(data.get("affected_deliveries", [])) >= 3)

    # 13. Officers
    res = client.get("/api/officers")
    data = res.get_json() or {}
    check("GET /api/officers", res.status_code == 200 and len(data.get("data", [])) >= 8)

    # 14. Assign Officer
    res = client.post("/api/officers/FO-042/assign", json={"incident_code": "INC-001", "note": "Assigned to clearing operations"})
    data = res.get_json() or {}
    check("POST /api/officers/FO-042/assign", res.status_code == 200)

    # 15. Districts
    res = client.get("/api/districts")
    data = res.get_json() or {}
    check("GET /api/districts", res.status_code == 200 and len(data.get("data", [])) == 5)

    # 16. Infrastructure
    res = client.get("/api/infrastructure")
    data = res.get_json() or {}
    check("GET /api/infrastructure", res.status_code == 200 and len(data.get("data", [])) == 12)

    # 17. Update Infrastructure Condition
    res = client.post("/api/infrastructure/INF-001/condition", json={"condition": "Moderate", "risk_pct": 50})
    data = res.get_json() or {}
    check("POST /api/infrastructure/INF-001/condition", res.status_code == 200)

    # 18. Reports
    res = client.get("/api/reports?district=Visakhapatnam")
    data = res.get_json() or {}
    check("GET /api/reports?district=...", res.status_code == 200 and len(data.get("data", [])) >= 1)

    # 19. Export Reports
    res = client.get("/api/reports/export/excel")
    data = res.get_json() or {}
    check("GET /api/reports/export/excel", res.status_code == 200 and data.get("format") == "EXCEL")

    # 20. AI Route Predictor
    ai_req = {"source": "Visakhapatnam Port", "destination": "Paderu", "vehicle_type": "Medicine Truck"}
    res = client.post("/api/ai/predict-route", json=ai_req)
    data = res.get_json() or {}
    check("POST /api/ai/predict-route", res.status_code == 200 and "risk_score" in data and len(data.get("routes", [])) >= 3)

    # 21. Vision AI Photo Analyzer
    res = client.post("/api/ai/analyze-photo", json={"filename": "paderu_landslide.jpg"})
    data = res.get_json() or {}
    check("POST /api/ai/analyze-photo", res.status_code == 200 and data.get("hazard_type") == "Landslide Debris")

    # 22. AI Command NLP
    res = client.post("/api/ai/command", json={"query": "Which roads are blocked right now?"})
    data = res.get_json() or {}
    check("POST /api/ai/command", res.status_code == 200 and data.get("intent") == "BLOCKED_ROADS")

    # 23. Simulation Phases
    res = client.get("/api/simulation/phases")
    data = res.get_json() or {}
    check("GET /api/simulation/phases", res.status_code == 200 and data.get("total_phases") == 18)

    # 24. Trigger Simulation Phase
    res = client.post("/api/simulation/phase/4")
    data = res.get_json() or {}
    check("POST /api/simulation/phase/4", res.status_code == 200 and data.get("phase") == 4)

    # 25. Reset Simulation
    res = client.post("/api/simulation/reset")
    data = res.get_json() or {}
    check("POST /api/simulation/reset", res.status_code == 200)

    # 26. Static Serving
    res = client.get("/")
    check("GET / (Static HTML serving)", res.status_code == 200)

    res = client.get("/dashboard.html")
    check("GET /dashboard.html", res.status_code == 200)

    print("=" * 60)
    print(f"  TEST RESULTS: {passed} PASSED, {failed} FAILED (TOTAL: {passed + failed})")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
