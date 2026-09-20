"""
OpenRouteService proxy — key stays server-side only.
Leaflet UI → /api/routing/* → ORS → geometry back to map.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Optional, Tuple

from flask import Blueprint, jsonify, request

routing_bp = Blueprint("routing_bp", __name__)

ORS_BASE = os.environ.get(
    "OPENROUTESERVICE_BASE_URL",
    "https://api.heigit.org/openrouteservice/v2",
).rstrip("/")


def _api_key() -> Optional[str]:
    key = os.environ.get("OPENROUTESERVICE_API_KEY") or os.environ.get("ORS_API_KEY")
    if key:
        key = key.strip()
    return key or None


def _ors_request(path: str, body: dict) -> Tuple[Optional[dict], Optional[str], int]:
    key = _api_key()
    if not key:
        return None, "OPENROUTESERVICE_API_KEY is not set on the server", 503

    url = f"{ORS_BASE}{path}"
    raw = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=raw,
        method="POST",
        headers={
            "Authorization": key,
            "Content-Type": "application/json",
            "Accept": "application/json, application/geo+json",
            "User-Agent": "SmartRoute-NER/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            return payload, None, 200
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode("utf-8", errors="replace")[:400]
        except Exception:
            detail = str(e)
        return None, f"ORS HTTP {e.code}: {detail}", e.code if e.code else 502
    except Exception as e:
        return None, f"ORS request failed: {e}", 502


def _coords_from_body(data: dict) -> Optional[list]:
    coords = data.get("coordinates")
    order = (data.get("order") or "latlng").lower()

    if coords and isinstance(coords, list) and len(coords) >= 2:
        out = []
        for p in coords:
            if not isinstance(p, (list, tuple)) or len(p) < 2:
                continue
            a, b = float(p[0]), float(p[1])
            if order == "lnglat":
                out.append([a, b])
            else:
                out.append([b, a])
        return out if len(out) >= 2 else None

    start = data.get("start") or data.get("from")
    end = data.get("end") or data.get("to")
    if start is not None and end is not None:
        def pair(p):
            if isinstance(p, dict):
                return [float(p["lng"]), float(p["lat"])]
            return [float(p[1]), float(p[0])]
        return [pair(start), pair(end)]

    return None


def _parse_geojson_feature_collection(payload: dict) -> list:
    routes = []
    features = payload.get("features") or []
    for i, feat in enumerate(features):
        geom = (feat or {}).get("geometry") or {}
        props = (feat or {}).get("properties") or {}
        summary = props.get("summary") or {}
        segs = props.get("segments") or []
        if not summary and segs:
            summary = {
                "distance": sum(s.get("distance", 0) for s in segs),
                "duration": sum(s.get("duration", 0) for s in segs),
            }
        coords_lnglat = geom.get("coordinates") or []
        latlngs = [[c[1], c[0]] for c in coords_lnglat if isinstance(c, (list, tuple)) and len(c) >= 2]
        routes.append({
            "index": i,
            "coordinates": latlngs,
            "distance_m": summary.get("distance"),
            "duration_s": summary.get("duration"),
            "distance_km": round((summary.get("distance") or 0) / 1000.0, 2),
            "duration_min": round((summary.get("duration") or 0) / 60.0, 1),
        })
    return routes


def _parse_json_directions(payload: dict) -> list:
    routes = []
    for i, r in enumerate(payload.get("routes") or []):
        summary = r.get("summary") or {}
        geom = r.get("geometry")
        latlngs = []
        if isinstance(geom, dict) and geom.get("coordinates"):
            latlngs = [[c[1], c[0]] for c in geom["coordinates"]]
        routes.append({
            "index": i,
            "coordinates": latlngs,
            "distance_m": summary.get("distance"),
            "duration_s": summary.get("duration"),
            "distance_km": round((summary.get("distance") or 0) / 1000.0, 2),
            "duration_min": round((summary.get("duration") or 0) / 60.0, 1),
        })
    return routes


@routing_bp.route("/routing/health", methods=["GET"])
def routing_health():
    key = _api_key()
    return jsonify({
        "status": "ok" if key else "missing_key",
        "ors_configured": bool(key),
        "base": ORS_BASE,
    })


@routing_bp.route("/routing/directions", methods=["POST"])
def directions():
    data = request.get_json() or {}
    coords = _coords_from_body(data)
    if not coords:
        return jsonify({
            "status": "error",
            "message": "Provide start/end or coordinates (lat/lng pairs)",
        }), 400

    profile = data.get("profile") or "driving-car"
    body = {
        "coordinates": coords,
        "instructions": False,
        "geometry": True,
    }

    want_alts = bool(data.get("alternatives") or data.get("alternative_routes"))
    if want_alts:
        body["alternative_routes"] = {
            "target_count": int(data.get("alternative_count") or 2),
            "share_factor": float(data.get("share_factor") or 0.6),
            "weight_factor": float(data.get("weight_factor") or 1.4),
        }

    path = f"/directions/{profile}/geojson"
    payload, err, status = _ors_request(path, body)

    if err and want_alts and status in (400, 404, 501):
        body.pop("alternative_routes", None)
        payload, err, status = _ors_request(path, body)

    if err:
        return jsonify({
            "status": "error",
            "message": err,
            "fallback_hint": "Configure OPENROUTESERVICE_API_KEY or use offline demo geometry",
        }), status if status >= 400 else 502

    routes = _parse_geojson_feature_collection(payload) if payload else []
    if not routes and payload:
        routes = _parse_json_directions(payload)

    return jsonify({
        "status": "success",
        "provider": "openrouteservice",
        "profile": profile,
        "count": len(routes),
        "routes": routes,
        "primary": routes[0] if routes else None,
    })
