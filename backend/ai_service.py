"""
SmartRoute AI & Machine Learning Intelligence Service
----------------------------------------------------
Provides:
- Predictive route risk analysis
- Vision-based damage appraisal
- Natural language command intent parsing
"""

from typing import Dict, Any, List
from datetime import datetime
import random


def _now() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _severity(score: int) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 55:
        return "HIGH"
    if score >= 35:
        return "MODERATE"
    return "LOW"


def _bar_color(value: int) -> str:
    if value >= 70:
        return "var(--status-danger)"
    if value >= 40:
        return "var(--status-warn)"
    return "var(--status-safe)"


def predict_route_risk(
    source: str,
    destination: str,
    vehicle_type: str = "Medicine Truck",
    priority: str = "Critical",
) -> Dict[str, Any]:
    """
    Calculate multi-factor transport risk and suggest alternate routes.
    Risk Equation: R = 0.35*Weather + 0.25*Slope + 0.20*Condition + 0.20*Traffic
    """
    src = (source or "").lower()
    dst = (destination or "").lower()

    # High-risk keywords (Andhra agency + NER hill stations / landslide-prone)
    high_risk_keywords = [
        "paderu", "narsipatnam", "nrsp",
        "tawang", "itanagar", "shillong", "kohima", "aizawl",
        "imphal", "gangtok", "dimapur"
    ]
    is_high_risk = any(k in src or k in dst for k in high_risk_keywords)

    # Base factors (0-100)
    if is_high_risk:
        weather = random.randint(55, 92)
        slope = random.randint(55, 85)
        condition = random.randint(40, 78)
        traffic = random.randint(30, 70)
    else:
        weather = random.randint(12, 42)
        slope = random.randint(10, 35)
        condition = random.randint(15, 40)
        traffic = random.randint(10, 35)

    # Weighted score
    risk_score = int(
        0.35 * weather +
        0.25 * slope +
        0.20 * condition +
        0.20 * traffic
    )

    # Priority / vehicle boost
    if priority.lower() == "critical" or "medicine" in vehicle_type.lower() or "emergency" in vehicle_type.lower():
        risk_score = min(100, risk_score + 10)

    severity = _severity(risk_score)
    flood_risk = max(10, weather - 8)
    landslide_risk = max(8, slope - 5)

    # Generate routes
    if is_high_risk or risk_score > 50:
        routes = [
            {
                "id": "route-a",
                "name": "Route A — Recommended Detour",
                "recommended": True,
                "distance_km": 142,
                "eta": "3h 45m",
                "delay": "+25m",
                "risk_score": max(18, risk_score - 45),
                "risk_level": "LOW",
                "traffic": "Light",
                "condition": "Good",
                "safe": True,
            },
            {
                "id": "route-b",
                "name": "Route B — Secondary Corridor",
                "recommended": False,
                "distance_km": 118,
                "eta": "4h 20m",
                "delay": "+1h 10m",
                "risk_score": max(40, risk_score - 15),
                "risk_level": "MODERATE",
                "traffic": "Heavy",
                "condition": "Fair",
                "safe": False,
            },
            {
                "id": "route-c",
                "name": "Route C — Original Path",
                "recommended": False,
                "distance_km": 156,
                "eta": "5h 10m",
                "delay": "+2h 00m",
                "risk_score": risk_score,
                "risk_level": severity,
                "traffic": "Moderate",
                "condition": "Poor",
                "safe": False,
            },
        ]
    else:
        routes = [
            {
                "id": "route-direct",
                "name": "Direct Highway",
                "recommended": True,
                "distance_km": 85,
                "eta": "1h 45m",
                "delay": "+0m",
                "risk_score": risk_score,
                "risk_level": "LOW",
                "traffic": "Light",
                "condition": "Excellent",
                "safe": True,
            }
        ]

    best_route = min(routes, key=lambda r: r["risk_score"])

    return {
        "status": "success",
        "source": source,
        "destination": destination,
        "vehicle_type": vehicle_type,
        "priority": priority,
        "risk_score": risk_score,
        "severity": severity,
        "breakdown": {
            "road_condition": condition,
            "weather_risk": weather,
            "traffic_load": traffic,
            "flood_risk": flood_risk,
            "landslide_risk": landslide_risk,
        },
        "metrics": {
            "est_delay": f"+{max(0, risk_score // 25)}h {(risk_score % 25) * 2}m",
            "road_accessibility_pct": max(15, 100 - risk_score),
            "disruption_probability": "HIGH" if risk_score > 60 else "LOW",
            "rec_departure": "Immediate" if risk_score < 40 else "06:00 AM",
        },
        "routes": routes,
        "best_route": best_route,
        "timestamp": _now(),
    }


def analyze_damage_photo(
    filename: str = "",
    metadata: Dict[str, Any] = None,
) -> Dict[str, Any]:
    """
    Simulated computer-vision pipeline for road distress detection.
    """
    fn = (filename or "").lower()
    confidence = round(random.uniform(88.0, 96.5), 1)

    if any(k in fn for k in ["landslide", "debris", "rock", "mud"]):
        return _build_hazard(
            hazard_type="Landslide Debris",
            severity="Critical",
            damage_pct=92.4,
            debris_volume=45.8,
            affected_meters=35.0,
            passable=False,
            action="Deploy hydraulic excavator & NDRF Unit-7 for clearance",
            confidence=confidence,
        )

    if any(k in fn for k in ["flood", "water", "submerge"]):
        return _build_hazard(
            hazard_type="Flash Flood Submergence",
            severity="Critical",
            damage_pct=85.0,
            debris_volume=0.0,
            affected_meters=62.0,
            passable=False,
            action="Close sector causeway; route traffic to elevated corridor",
            confidence=confidence,
        )

    if any(k in fn for k in ["crack", "fissure"]):
        return _build_hazard(
            hazard_type="Structural Longitudinal Fissure",
            severity="Medium",
            damage_pct=48.0,
            debris_volume=1.2,
            affected_meters=12.0,
            passable=True,
            action="Apply speed limit 20 km/h; schedule bituminous sealing",
            confidence=confidence,
        )

    return _build_hazard(
        hazard_type="Severe Pothole Cluster",
        severity="High",
        damage_pct=68.5,
        debris_volume=3.4,
        affected_meters=18.0,
        passable=True,
        action="Asphalt patching team required within 24 hours",
        confidence=confidence,
    )


def _build_hazard(
    hazard_type: str,
    severity: str,
    damage_pct: float,
    debris_volume: float,
    affected_meters: float,
    passable: bool,
    action: str,
    confidence: float,
) -> Dict[str, Any]:
    return {
        "status": "success",
        "hazard_type": hazard_type,
        "severity": severity,
        "damage_pct": damage_pct,
        "debris_volume_m3": debris_volume,
        "affected_meters": affected_meters,
        "confidence_pct": confidence,
        "passable_for_heavy_vehicles": passable,
        "recommended_action": action,
        "detected_objects": [
            {
                "label": "Asphalt Fracture",
                "box": [0.20, 0.30, 0.70, 0.80],
                "score": round(confidence / 100, 2),
            },
            {
                "label": "Debris Mound",
                "box": [0.40, 0.20, 0.90, 0.60],
                "score": 0.89,
            },
        ],
        "analysis_time_ms": random.randint(320, 780),
        "timestamp": _now(),
    }


def process_command_query(query: str) -> Dict[str, Any]:
    """
    Lightweight intent parser for the emergency command center.
    """
    q = (query or "").lower().strip()

    if not q:
        return {
            "status": "success",
            "reply": "Command Assistant standby. Ask me about blocked roads, delayed convoys, or weather risk.",
        }

    if any(k in q for k in ["blocked", "impassable", "closed", "cut off"]):
        return {
            "status": "success",
            "intent": "BLOCKED_ROADS",
            "reply": (
                "<strong>CRITICAL OBSTRUCTION DETECTED:</strong><br>"
                "State Highway 39 (SH-39) KM 48 between Narsipatnam and Paderu is completely "
                "<strong>BLOCKED</strong> due to a 45m³ landslide.<br><br>"
                "• <strong>Affected Convoys:</strong> 3 vehicles stalled (including Medicine Convoy VH-001)<br>"
                "• <strong>Recommended Detour:</strong> Route via Chintapalle (SH-34) saves 1h 45m.<br>"
                "• <strong>NDRF Clearance ETA:</strong> 4 hours."
            ),
        }

    if any(k in q for k in ["medicine", "medical", "convoy", "hospital", "phc", "deliver"]):
        return {
            "status": "success",
            "intent": "MEDICINE_DELIVERIES",
            "reply": (
                "<strong>MEDICINE CONVOY TELEMETRY:</strong><br>"
                "• <strong>VH-001 (Medicines / Antibiotics):</strong> Stalled at SH-39 KM 46. "
                "Projected delay +2h 45m.<br>"
                "• <strong>VH-006 (Vaccine Cold Chain):</strong> In transit to Hukumpeta on SH-40. "
                "On track for 14:50 arrival.<br><br>"
                "<em>Action: Rerouting VH-001 via SH-34 is recommended immediately to prevent cold chain breach.</em>"
            ),
        }

    if any(k in q for k in ["safe", "safest", "alternate", "reroute", "route", "detour"]):
        return {
            "status": "success",
            "intent": "SAFEST_ROUTE",
            "reply": (
                "<strong>AI OPTIMAL ROUTE SELECTION:</strong><br>"
                "• <strong>Primary Recommended:</strong> Route A via Chintapalle (SH-34) — 142 km, ETA 3h 45m.<br>"
                "• <strong>Risk Score:</strong> 28/100 (LOW)<br>"
                "• <strong>Road Status:</strong> 100% operational with minimal rain accumulation.<br>"
                "• <strong>Bridge Integrity:</strong> All 4 river bridges green."
            ),
        }

    if any(k in q for k in ["risk", "district", "alluri", "danger", "worst", "critical"]):
        return {
            "status": "success",
            "intent": "DISTRICT_RISK",
            "reply": (
                "<strong>HIGHEST RISK JURISDICTION:</strong><br>"
                "<strong>Alluri Sitharama Raju District</strong> is currently at "
                "<strong>88% CRITICAL RISK</strong>.<br>"
                "• <strong>Active Incidents:</strong> 8 (including 2 landslides and 1 bridge warning)<br>"
                "• <strong>Precipitation:</strong> 78 mm/hr (IMD Red Alert)<br>"
                "• <strong>Road Accessibility Index:</strong> 42% operational.<br>"
                "• <strong>Field Officers Deployed:</strong> 4 active officers in sector."
            ),
        }

    if any(k in q for k in ["officer", "police", "team", "ndrf", "deployed"]):
        return {
            "status": "success",
            "intent": "OFFICER_STATUS",
            "reply": (
                "<strong>FIELD OFFICER DEPLOYMENT:</strong><br>"
                "• <strong>FO-042 (Ravi Kumar):</strong> On-site at SH-39 KM 48 coordinating earthmovers.<br>"
                "• <strong>FO-015 (Lakshmi Devi):</strong> Patrolling Narsipatnam coastal bypass.<br>"
                "• <strong>FO-061 (Anand Babu):</strong> Inspecting Sileru river bridge superstructure.<br>"
                "• <strong>Total Active Personnel:</strong> 7 online, 1 off-duty."
            ),
        }

    return {
        "status": "success",
        "intent": "GENERAL_STATUS",
        "reply": (
            "<strong>SMARTROUTE AI COMMAND:</strong><br>"
            "Monitoring 6 arterial highways and 12 critical bridges across Visakhapatnam Agency tribal belt.<br>"
            "Current system status: <strong>1 Critical Blockage (SH-39)</strong>, "
            "2 Partial Restrictions, 6 Convoys Active.<br>"
            "Type <em>'blocked roads'</em>, <em>'medicine deliveries'</em>, or <em>'safest route'</em> "
            "for detailed telemetry."
        ),
    }
