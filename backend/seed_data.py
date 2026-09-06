"""
SmartRoute Seed Data Generator
Populates SQLite database with comprehensive emergency management data
for the Visakhapatnam Agency tribal belt.
"""

import json
from .database import get_db, init_db

def seed_database():
    """Populate database tables with initial records if empty."""
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM roads;")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    # 1. Seed Roads
    roads = [
        ("SH-39", "State Highway 39 (Narsipatnam - Paderu)", "State Highway", "blocked", "Critical", 86,
         json.dumps([[17.67, 82.61], [17.75, 82.63], [17.85, 82.65], [17.95, 82.66], [18.08, 82.66]]),
         40, 68.5),
        ("NH-516E", "National Highway 516E (Vizag - Araku)", "National Highway", "partial", "Moderate", 48,
         json.dumps([[17.72, 83.30], [17.85, 83.15], [18.05, 83.00], [18.20, 82.90], [18.33, 82.87]]),
         60, 115.0),
        ("SH-34", "State Highway 34 (Chintapalle - Araku)", "State Highway", "safe", "Good", 22,
         json.dumps([[17.87, 82.35], [18.00, 82.48], [18.15, 82.65], [18.33, 82.87]]),
         50, 74.2),
        ("SH-40", "State Highway 40 (Paderu - GK Veedhi)", "State Highway", "partial", "Moderate", 55,
         json.dumps([[18.08, 82.66], [18.02, 82.48], [17.95, 82.32], [17.89, 82.17]]),
         45, 58.0),
        ("MDR-12", "Major District Road 12 (Koyyuru - Chintapalle)", "Major District Road", "safe", "Good", 15,
         json.dumps([[17.66, 82.16], [17.74, 82.23], [17.81, 82.29], [17.87, 82.35]]),
         50, 32.0),
        ("VJY-1", "Agency Trunk Road (GK Veedhi - Sileru)", "Trunk Road", "warning", "Poor", 72,
         json.dumps([[17.89, 82.17], [17.95, 82.08], [18.05, 81.95], [18.15, 81.85]]),
         35, 48.0)
    ]
    cursor.executemany("""
    INSERT INTO roads (code, name, type, status, condition, risk_score, coords_json, speed_limit, length_km)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, roads)

    # 2. Seed Incidents
    incidents = [
        ("INC-001", "Landslide — SH-39 KM48", "Obstruction", "critical", "Active", 18.05, 82.74,
         "SH-39", "State Highway 39", "Massive rockfall blocking both lanes. Immediate heavy equipment clearance needed.",
         "08:32 AM", "Auto-Sensor S-04",
         json.dumps([{"title": "Detected", "time": "08:32 AM", "done": True},
                     {"title": "Verified by Command", "time": "08:35 AM", "done": True},
                     {"title": "Units Alerted", "time": "08:38 AM", "done": True},
                     {"title": "NDRF Dispatched", "time": "Pending", "done": False}])),
        ("INC-002", "Landslide Debris — Araku Ghat", "Obstruction", "high", "Active", 17.82, 82.85,
         "NH-516E", "National Highway 516E", "Loose gravel and tree collapse on hairpin turn 6. Single lane traffic.",
         "09:15 AM", "FO-042 Ravi Kumar",
         json.dumps([{"title": "Detected", "time": "09:15 AM", "done": True},
                     {"title": "Verified", "time": "09:18 AM", "done": True},
                     {"title": "Traffic Diverted", "time": "Pending", "done": False}])),
        ("INC-006", "Bridge Warning — GK Veedhi", "Infrastructure", "high", "Active", 18.38, 82.50,
         "SH-40", "State Highway 40", "Water level 20cm below deck level. Bridge piers vibrating under heavy flow.",
         "12:35 PM", "Hydrology Sensor H-12",
         json.dumps([{"title": "Sensor Triggered", "time": "12:35 PM", "done": True},
                     {"title": "Inspection Assigned", "time": "12:40 PM", "done": True}])),
        ("INC-008", "Flash Flood — Hukumpeta", "Weather", "critical", "Active", 18.55, 83.00,
         "MDR-12", "Hukumpeta Main Access", "River overflowed causeway. Water depth 1.2m across 60 meters of road.",
         "01:10 PM", "FO-055 Rajesh Varma",
         json.dumps([{"title": "Reported", "time": "01:10 PM", "done": True},
                     {"title": "Emergency Declared", "time": "01:15 PM", "done": True}]))
    ]
    cursor.executemany("""
    INSERT INTO incidents (code, title, type, severity, status, lat, lng, road_code, road_name, description, detected_time, reported_by, timeline_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, incidents)

    # 3. Seed Vehicles
    vehicles = [
        ("VH-001", "Convoy Alpha (Medicines)", "Medicine Truck", "Critical Antibiotics & Saline", "blocked",
         18.02, 82.72, 0, 45.0, "Paderu Government Hospital", "14:30", "SH-39", 45),
        ("VH-002", "Supply Unit Beta (Food)", "Food Transport", "Rations & Drinking Water", "delayed",
         17.88, 82.50, 32, 120.0, "Chintapalle Community Center", "16:45", "SH-34", 60),
        ("VH-003", "Emergency Unit 1", "Ambulance", "Paramedic Life Support", "on-route",
         18.25, 82.80, 55, 30.0, "Araku Valley PHC", "15:10", "NH-516E", 75),
        ("VH-004", "Rescue Team Charlie", "NDRF Heavy Vehicle", "Excavator & Clearance Gear", "on-route",
         17.78, 82.68, 48, 60.0, "SH-39 KM48 Site", "13:55", "SH-39", 70),
        ("VH-005", "Agri Supply 5", "Grain Carrier", "Seeds & Fertilisers", "blocked",
         17.92, 82.22, 0, 270.0, "GK Veedhi Storage", "Delayed", "VJY-1", 30),
        ("VH-006", "Convoy Delta (Vaccines)", "Refrigerated Van", "Vaccines (Cold Chain)", "on-route",
         18.12, 82.68, 52, 15.0, "Hukumpeta Medical Camp", "14:50", "SH-40", 80)
    ]
    cursor.executemany("""
    INSERT INTO vehicles (code, name, type, cargo, status, lat, lng, speed_kmh, heading, destination, eta, route_id, progress_pct)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, vehicles)

    # 4. Seed Deliveries
    deliveries = [
        ("DEL-001", "Medicines", "VH-001", "Vizag Port", "Paderu PHC", "14:30", "At-risk", "High", 75, "Cold storage vaccines & IV fluids"),
        ("DEL-002", "Food", "VH-002", "Rajahmundry", "Chintapalle", "16:45", "Delayed", "Moderate", 45, "Wheat flour, rice and pulse packets"),
        ("DEL-003", "Emergency", "VH-003", "Vizag Trauma", "Araku Valley", "15:10", "At-risk", "High", 35, "Oxygen cylinders and first-aid kits"),
        ("DEL-004", "Medicines", "VH-006", "Paderu", "Hukumpeta", "14:50", "On-track", "Low", 0, "Anti-venom and emergency medicines"),
        ("DEL-005", "Agriculture", "VH-005", "Kakinada", "GK Veedhi", "Delayed", "Blocked", "Critical", 120, "Organic fertilizers & seeds"),
        ("DEL-006", "Food", "VH-002", "Vizag Urban", "Narsipatnam", "13:30", "Delivered", "Low", 0, "Milk and essential baby food"),
        ("DEL-007", "Construction", "VH-004", "Rajam", "Paderu", "17:00", "On-track", "Moderate", 15, "Steel reinforcement bars"),
        ("DEL-008", "Emergency", "VH-004", "Vizag HQ", "SH-39 KM48", "13:55", "Critical", "Critical", 90, "High-capacity hydraulic rock cutter")
    ]
    cursor.executemany("""
    INSERT INTO deliveries (code, category, vehicle_code, origin, destination, eta, status, risk_level, delay_mins, items_desc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, deliveries)

    # 5. Seed Officers
    officers = [
        ("FO-042", "Ravi Kumar", "RK", "Alluri Sitharama Raju", 18.05, 82.74, "ACTIVE", "At SH-39 blockage site coordinating clearance", 4, 112),
        ("FO-015", "Lakshmi Devi", "LD", "Visakhapatnam", 17.75, 83.05, "ACTIVE", "Narsipatnam coastal sector patrol", 6, 95),
        ("FO-028", "Suresh Rao", "SR", "Parvathipuram Manyam", 18.52, 83.38, "REPORTING", "Submitting bridge risk appraisal", 3, 78),
        ("FO-061", "Anand Babu", "AB", "Alluri Sitharama Raju", 18.22, 82.80, "ACTIVE", "Culvert structural ultrasound scanning", 5, 134),
        ("FO-033", "Priya Singh", "PS", "Anakapalli", 17.68, 82.98, "OFF DUTY", "Shift completed at 18:00", 2, 45),
        ("FO-077", "Mohan Rao", "MR", "Visakhapatnam", 17.60, 83.20, "ACTIVE", "Highway checkpoint monitoring", 5, 88),
        ("FO-089", "Kavitha Reddy", "KR", "Alluri Sitharama Raju", 18.33, 82.87, "ACTIVE", "Araku valley slope sensor verification", 3, 102),
        ("FO-055", "Rajesh Varma", "RV", "Parvathipuram Manyam", 18.55, 83.00, "ACTIVE", "Hukumpeta flash flood monitoring", 7, 140)
    ]
    cursor.executemany("""
    INSERT INTO officers (code, name, initials, district, lat, lng, status, note, reports_count, km_covered)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, officers)

    # 6. Seed Districts
    districts = [
        ("Alluri Sitharama Raju", "CRITICAL", 42, "Heavy Rain (78mm)", 88,
         json.dumps([[18.0, 82.5], [18.5, 82.5], [18.6, 83.0], [18.1, 83.2], [17.9, 83.0]]), 8, 28, 45),
        ("Visakhapatnam", "HIGH", 68, "Rain (32mm)", 65,
         json.dumps([[17.5, 83.0], [17.9, 83.0], [17.95, 83.4], [17.5, 83.45]]), 5, 42, 52),
        ("Parvathipuram Manyam", "MODERATE", 71, "Moderate Showers", 51,
         json.dumps([[18.4, 83.0], [18.7, 83.0], [18.8, 83.5], [18.4, 83.6]]), 3, 22, 28),
        ("Anakapalli", "LOW", 91, "Overcast", 18,
         json.dumps([[17.6, 82.8], [17.9, 82.8], [17.9, 83.1], [17.6, 83.0]]), 1, 35, 38),
        ("Eluru", "LOW", 94, "Partly Cloudy", 12,
         json.dumps([[16.5, 81.0], [16.9, 81.0], [16.9, 81.4], [16.5, 81.4]]), 0, 50, 42)
    ]
    cursor.executemany("""
    INSERT INTO districts (name, risk_level, accessibility_pct, weather_status, risk_score, coords_json, incidents_count, roads_count, vehicles_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, districts)

    # 7. Seed Infrastructure
    infra = [
        ("INF-001", "SH-39 (Narsipatnam-Paderu)", "Road", "Critical", 95, "Blocked", 17.85, 82.52, "2024-08-12", "#ff3b3b",
         json.dumps(["2024-08-12: Structural scan completed", "2024-02-15: Routine maintenance check"])),
        ("INF-002", "Sileru River Bridge", "Bridge", "Poor", 78, "Warning", 18.02, 82.15, "2024-07-20", "#ff9500",
         json.dumps(["2024-07-20: Scour depth inspection", "2023-11-04: Pier re-grouting"])),
        ("INF-003", "NH-516E (Vizag-Araku)", "Road", "Poor", 65, "Partial", 18.25, 82.90, "2024-08-28", "#ff9500",
         json.dumps(["2024-08-28: Surface crack mapping"])),
        ("INF-004", "Godavari Culvert", "Culvert", "Moderate", 45, "Monitor", 17.65, 82.40, "2024-09-01", "#ffd700",
         json.dumps(["2024-09-01: Drainage check"])),
        ("INF-005", "SH-34 (Chintapalle-Araku)", "Road", "Good", 28, "Operational", 18.05, 82.60, "2024-09-03", "#00ff88",
         json.dumps(["2024-09-03: Routine patrol passed"])),
        ("INF-006", "Machkund Bridge", "Bridge", "Good", 22, "Operational", 18.58, 82.52, "2024-08-30", "#00ff88",
         json.dumps(["2024-08-30: Load-bearing integrity tested"])),
        ("INF-007", "SH-40 (Paderu-GKVeedhi)", "Road", "Moderate", 51, "Partial", 18.00, 82.45, "2024-08-25", "#ffd700",
         json.dumps(["2024-08-25: Shoulder repair completed"])),
        ("INF-008", "Hukumpeta Culvert", "Culvert", "Excellent", 8, "Operational", 18.20, 82.75, "2024-09-04", "#00ff88",
         json.dumps(["2024-09-04: Full clearance confirmed"])),
        ("INF-009", "Koyyuru-Chintapalle Road", "Road", "Good", 31, "Operational", 17.75, 82.30, "2024-09-02", "#00ff88",
         json.dumps(["2024-09-02: Clear route inspection"])),
        ("INF-010", "Paderu Town Bridge", "Bridge", "Poor", 71, "Warning", 18.08, 82.66, "2024-07-15", "#ff9500",
         json.dumps(["2024-07-15: Foundation vibration alert"])),
        ("INF-011", "VR-28 (Vizag Coastal)", "Road", "Good", 25, "Operational", 17.70, 83.25, "2024-09-03", "#00ff88",
         json.dumps(["2024-09-03: Heavy vehicle check passed"])),
        ("INF-012", "Araku Valley Tunnel", "Tunnel", "Moderate", 42, "Monitor", 18.33, 82.87, "2024-08-20", "#ffd700",
         json.dumps(["2024-08-20: Tunnel ventilation inspection"]))
    ]
    cursor.executemany("""
    INSERT INTO infrastructure (code, name, type, condition, risk_pct, status, lat, lng, last_inspection, color, history_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, infra)

    # 8. Seed Reports
    reports = [
        ("RPT-2089", "Flash Flood", "Narsipatnam", "FO-015", "2026-09-05 09:15", "High", "Open", "Visakhapatnam", "17.67° N, 82.61° E", "Rising water levels on coastal bypass"),
        ("RPT-2088", "Landslide", "SH-39 KM48", "FO-042", "2026-09-05 08:32", "Critical", "In Progress", "Alluri Sitharama Raju", "18.05° N, 82.74° E", "Complete road obstruction on pass"),
        ("RPT-2087", "Road Damage", "Araku Valley", "FO-089", "2026-09-05 10:05", "Medium", "Verified", "Alluri Sitharama Raju", "18.33° N, 82.87° E", "Surface pothole cluster KM 12"),
        ("RPT-2086", "Bridge Warning", "GK Veedhi", "FO-061", "2026-09-05 11:05", "High", "Open", "Alluri Sitharama Raju", "18.22° N, 82.80° E", "Bridge superstructure stress detection"),
        ("RPT-2085", "Road Crack", "Narsipatnam KM12", "FO-015", "2026-09-05 11:48", "Medium", "Open", "Visakhapatnam", "17.70° N, 82.65° E", "Longitudinal 4m fissure across asphalt"),
        ("RPT-2084", "Flash Flood", "Hukumpeta", "FO-055", "2026-09-05 13:10", "Critical", "Open", "Parvathipuram Manyam", "18.55° N, 83.00° E", "Submerged culvert causeway"),
        ("RPT-2083", "Road Damage", "Koyyuru", "FO-028", "2026-09-04 15:30", "Low", "Resolved", "Alluri Sitharama Raju", "17.75° N, 82.30° E", "Debris cleared by road crew"),
        ("RPT-2082", "Bridge Crack", "Paderu", "FO-061", "2026-09-04 11:20", "High", "Resolved", "Alluri Sitharama Raju", "18.08° N, 82.66° E", "Pier cap reinforced"),
        ("RPT-2081", "Pothole", "Anakapalli", "FO-033", "2026-09-03 09:00", "Low", "Resolved", "Anakapalli", "17.68° N, 82.98° E", "Patching work completed"),
        ("RPT-2080", "Landslide", "Paderu", "FO-042", "2026-09-03 16:45", "High", "Resolved", "Alluri Sitharama Raju", "18.07° N, 82.74° E", "Boulders removed by earthmover")
    ]
    cursor.executemany("""
    INSERT INTO reports (code, incident, location, officer_code, timestamp, severity, status, district, coords, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, reports)

    # 9. Seed Users
    users = [
        ("USR-001", "Admin Officer", "Administrator", "HQ", "Active", "09:05 today"),
        ("USR-002", "Ravi Kumar", "Field Officer", "Alluri Sitharama Raju", "Active", "08:30 today"),
        ("USR-003", "District Collector", "Local Authority", "Alluri Sitharama Raju", "Active", "07:45 today"),
        ("USR-004", "Lakshmi Devi", "Field Officer", "Visakhapatnam", "Active", "08:15 today"),
        ("USR-005", "Suresh Rao", "Field Officer", "Parvathipuram Manyam", "Active", "09:20 today"),
        ("USR-006", "Priya Singh", "Field Officer", "Anakapalli", "Inactive", "2026-09-04"),
        ("USR-007", "Deputy Collector", "Local Authority", "Visakhapatnam", "Active", "09:10 today"),
        ("USR-008", "Mohan Rao", "Field Officer", "Visakhapatnam", "Active", "08:45 today"),
        ("USR-009", "System Analyst", "Administrator", "HQ", "Active", "07:30 today"),
        ("USR-010", "Rajesh Varma", "Field Officer", "Parvathipuram Manyam", "Active", "09:00 today")
    ]
    cursor.executemany("""
    INSERT INTO users (code, name, role, district, status, last_login)
    VALUES (?, ?, ?, ?, ?, ?);
    """, users)

    # 10. Seed Alerts
    alerts = [
        ("ALT-001", "Active Landslide Blockage on SH-39", "critical",
         "SH-39 KM48 pass completely obstructed. Automatic vehicle diversion active.", "SH-39", "08:32 AM", 1),
        ("ALT-002", "Heavy Rainfall Alert in Narsipatnam Sector", "high",
         "Continuous downpour (78mm) expected to exceed flash flood threshold in 2 hours.", "SH-39", "09:00 AM", 0),
        ("ALT-003", "Medicine Convoy VH-001 Delayed", "high",
         "Convoy carrying critical supplies stalled near pass. Reroute via Chintapalle recommended.", "SH-39", "09:15 AM", 0),
        ("ALT-004", "Bridge Scour Warning — GK Veedhi", "medium",
         "Sileru river water level approaching warning mark. Heavy vehicles restricted.", "SH-40", "10:30 AM", 0)
    ]
    cursor.executemany("""
    INSERT INTO alerts (code, title, severity, message, road_code, timestamp, acknowledged)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, alerts)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    seed_database()
    print("Database successfully seeded.")
