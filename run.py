"""
SmartRoute Root run.py
Allows running: python run.py
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.run import main

if __name__ == "__main__":
    main()
