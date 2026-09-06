"""
SmartRoute SQLite Database Manager
Provides connection pooling, schema initialization, and transactional helpers.
"""

import os
import sqlite3
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "smartroute.db"

def get_db():
    """Create and return a database connection with Row factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def query_db(query, args=(), one=False):
    """Convenience helper to query database and return dictionary results."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(query, args)
        r = cur.fetchall()
        cur.close()
        return (dict(r[0]) if r else None) if one else [dict(row) for row in r]
    finally:
        conn.close()

def execute_db(query, args=()):
    """Convenience helper to execute insert/update/delete and return lastrowid."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(query, args)
        conn.commit()
        last_id = cur.lastrowid
        cur.close()
        return last_id
    finally:
        conn.close()

def init_db(force_recreate=False):
    """Create all required tables if they don't exist."""
    if force_recreate and DB_PATH.exists():
        try:
            os.remove(DB_PATH)
        except Exception:
            pass

    conn = get_db()
    cursor = conn.cursor()

    # 1. Roads Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS roads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'State Highway',
        status TEXT NOT NULL DEFAULT 'safe',
        condition TEXT NOT NULL DEFAULT 'Good',
        risk_score INTEGER NOT NULL DEFAULT 10,
        coords_json TEXT NOT NULL,
        speed_limit INTEGER NOT NULL DEFAULT 60,
        length_km REAL NOT NULL DEFAULT 50.0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Incidents Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'Active',
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        road_code TEXT,
        road_name TEXT,
        description TEXT,
        detected_time TEXT,
        reported_by TEXT DEFAULT 'System Sensor',
        timeline_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Vehicles Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        cargo TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'on-route',
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        speed_kmh INTEGER NOT NULL DEFAULT 40,
        heading REAL NOT NULL DEFAULT 0.0,
        destination TEXT,
        eta TEXT,
        route_id TEXT,
        progress_pct INTEGER DEFAULT 50,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Deliveries Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        vehicle_code TEXT,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        eta TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'On-track',
        risk_level TEXT NOT NULL DEFAULT 'Low',
        delay_mins INTEGER NOT NULL DEFAULT 0,
        items_desc TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Officers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS officers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        initials TEXT NOT NULL,
        district TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        note TEXT,
        reports_count INTEGER DEFAULT 0,
        km_covered INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Districts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS districts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        risk_level TEXT NOT NULL DEFAULT 'LOW',
        accessibility_pct INTEGER NOT NULL DEFAULT 90,
        weather_status TEXT NOT NULL DEFAULT 'Clear',
        risk_score INTEGER NOT NULL DEFAULT 20,
        coords_json TEXT NOT NULL,
        incidents_count INTEGER NOT NULL DEFAULT 0,
        roads_count INTEGER NOT NULL DEFAULT 30,
        vehicles_count INTEGER NOT NULL DEFAULT 40
    );
    """)

    # 7. Infrastructure Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS infrastructure (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        condition TEXT NOT NULL,
        risk_pct INTEGER NOT NULL DEFAULT 20,
        status TEXT NOT NULL DEFAULT 'Operational',
        lat REAL,
        lng REAL,
        last_inspection TEXT,
        color TEXT DEFAULT '#00ff88',
        history_json TEXT
    );
    """)

    # 8. Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        incident TEXT NOT NULL,
        location TEXT NOT NULL,
        officer_code TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'Medium',
        status TEXT NOT NULL DEFAULT 'Open',
        district TEXT NOT NULL,
        coords TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 9. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Field Officer',
        district TEXT NOT NULL DEFAULT 'HQ',
        status TEXT NOT NULL DEFAULT 'Active',
        last_login TEXT
    );
    """)

    # 10. Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'high',
        message TEXT NOT NULL,
        road_code TEXT,
        timestamp TEXT NOT NULL,
        acknowledged INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")
