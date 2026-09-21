"""Call from incident/report handlers for role-targeted notifications."""

def notify_incident(title, message, severity="HIGH", incident_code=None, hazard_type=None):
    try:
        from .notification_service import notify_event
    except ImportError:
        from backend.notification_service import notify_event
    ntype = "INCIDENT"
    ht = (hazard_type or "").lower()
    if "landslide" in ht:
        ntype = "LANDSLIDE"
    elif "flood" in ht:
        ntype = "FLOOD"
    elif "block" in ht or "pothole" in ht:
        ntype = "ROAD_BLOCKED"
    return notify_event(
        title=title or "Incident alert",
        message=message or "A new incident was reported",
        notification_type=ntype,
        severity=severity or "HIGH",
        link="/incidents.html",
        event_key=incident_code or title,
    )

def notify_route_risk(source, destination, risk_score):
    try:
        from .notification_service import notify_event
    except ImportError:
        from backend.notification_service import notify_event
    sev = "CRITICAL" if risk_score >= 70 else ("HIGH" if risk_score >= 45 else "MEDIUM")
    return notify_event(
        title="High Risk Route" if risk_score >= 45 else "Route advisory",
        message=f"Risk {risk_score}% on corridor {source} → {destination}",
        notification_type="ROUTE_RISK",
        severity=sev,
        link="/route-prediction.html",
        event_key=f"route:{source}:{destination}:{int(risk_score)}",
    )
