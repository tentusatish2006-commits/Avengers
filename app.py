"""
SmartRoute Root app.py
Allows running: python app.py
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    port = 5000
    host = "127.0.0.1"
    print("=" * 65)
    print("  SMARTROUTE — AI EMERGENCY MANAGEMENT COMMAND SERVER")
    print(f"  Server URL: http://{host}:{port}/")
    print(f"  API Docs:   http://{host}:{port}/api/health")
    print("  Status:     ONLINE (SQLite WAL + AI Services Active)")
    print("=" * 65)
    app.run(host=host, port=port, debug=False)
