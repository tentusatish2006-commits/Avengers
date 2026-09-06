"""
Reports Repository and Export API Blueprint
"""

from flask import Blueprint, jsonify, request
from ..database import query_db, execute_db

reports_bp = Blueprint("reports_bp", __name__)

@reports_bp.route("/reports", methods=["GET"])
def get_reports():
    """Retrieve reports with query string filtering."""
    dist = request.args.get("district")
    sev = request.args.get("severity")
    stat = request.args.get("status")
    q = request.args.get("search")

    query = "SELECT * FROM reports WHERE 1=1"
    params = []

    if dist and dist != "All Districts":
        query += " AND district = ?"
        params.append(dist)
    if sev and sev != "All Severities":
        query += " AND severity = ?"
        params.append(sev)
    if stat and stat != "All Statuses":
        query += " AND status = ?"
        params.append(stat)
    if q:
        query += " AND (code LIKE ? OR incident LIKE ? OR location LIKE ? OR officer_code LIKE ?)"
        term = f"%{q}%"
        params.extend([term, term, term, term])

    query += " ORDER BY id DESC;"
    rows = query_db(query, params)
    return jsonify({"status": "success", "count": len(rows), "data": rows})

@reports_bp.route("/reports/<code>", methods=["GET"])
def get_report(code):
    """Retrieve details for a single report."""
    report = query_db("SELECT * FROM reports WHERE code = ? OR id = ?;", (code, code), one=True)
    if not report:
        return jsonify({"status": "error", "message": "Report not found"}), 404
    return jsonify({"status": "success", "data": report})

@reports_bp.route("/reports/export/<fmt>", methods=["GET"])
def export_reports(fmt):
    """Generate structured export payload for PDF / Excel generation."""
    rows = query_db("SELECT * FROM reports ORDER BY id DESC;")
    return jsonify({
        "status": "success",
        "format": fmt.upper(),
        "total_records": len(rows),
        "columns": ["Report ID", "Incident", "Location", "Officer", "Date/Time", "Severity", "Status", "District"],
        "records": rows
    })
