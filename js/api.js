/**
 * SmartRoute Client API Bridge
 * Connects frontend views to the Python Flask + SQLite Backend (/api)
 * Features automatic failover to local memory if backend is offline.
 */

(function() {
    const API_PORT = 5000;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const BASE_URL = (isLocalhost && window.location.port == API_PORT) 
        ? '/api' 
        : `http://127.0.0.1:${API_PORT}/api`;

    const SmartRouteAPI = {
        baseUrl: BASE_URL,
        isOnline: false,

        /**
         * Generic HTTP fetch wrapper with timeout and error fallback.
         */
        async request(endpoint, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(options.headers || {})
                    }
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }

                const data = await response.json();
                this.setOnline(true);
                return data;
            } catch (err) {
                clearTimeout(timeoutId);
                this.setOnline(false);
                return null;
            }
        },

        setOnline(status) {
            this.isOnline = status;
            const badge = document.getElementById('backend-status-badge');
            if (badge) {
                if (status) {
                    badge.innerHTML = '<span style="color:#00ff88;">●</span> API CONNECTED';
                    badge.className = 'badge badge-safe';
                    badge.title = 'Connected to SmartRoute SQLite + AI Backend (127.0.0.1:5000)';
                } else {
                    badge.innerHTML = '<span style="color:#aaa;">○</span> STANDALONE';
                    badge.className = 'badge';
                    badge.title = 'Offline mode (Fallback data active)';
                }
            }
        },

        /**
         * Healthcheck and connectivity test
         */
        async checkHealth() {
            const res = await this.request('/health');
            return res && res.status === 'healthy';
        },

        // --- Roads & Corridors ---
        async getRoads() {
            const res = await this.request('/roads');
            if (res && res.data) return res.data;
            return window.MapEngine ? window.MapEngine.ROAD_DATA : [];
        },

        async updateRoadStatus(code, status, riskScore) {
            return await this.request(`/roads/${code}/status`, {
                method: 'POST',
                body: JSON.stringify({ status, risk_score: riskScore })
            });
        },

        async getCorridors() {
            const res = await this.request('/corridors');
            return res ? res.data : null;
        },

        // --- Incidents & Alerts ---
        async getIncidents() {
            const res = await this.request('/incidents');
            if (res && res.data) return res.data;
            return window.MapEngine ? window.MapEngine.INCIDENT_DATA : [];
        },

        async reportIncident(data) {
            const res = await this.request('/incidents', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return res;
        },

        async advanceTimeline(code, step) {
            return await this.request(`/incidents/${code}/timeline`, {
                method: 'POST',
                body: JSON.stringify({ step })
            });
        },

        async getAlerts() {
            const res = await this.request('/alerts');
            return res ? res.data : [];
        },

        async acknowledgeAlert(code) {
            return await this.request(`/alerts/${code}/ack`, { method: 'POST' });
        },

        // --- Fleet Vehicles ---
        async getVehicles() {
            const res = await this.request('/vehicles');
            if (res && res.data) return res.data;
            return window.MapEngine ? window.MapEngine.VEHICLE_DATA : [];
        },

        async rerouteVehicle(code, route, eta) {
            return await this.request(`/vehicles/${code}/reroute`, {
                method: 'POST',
                body: JSON.stringify({ route, eta })
            });
        },

        // --- Deliveries ---
        async getDeliveries() {
            const res = await this.request('/deliveries');
            return res ? res.data : [];
        },

        async rerouteDeliveries() {
            return await this.request('/deliveries/reroute', { method: 'POST' });
        },

        // --- Field Officers ---
        async getOfficers() {
            const res = await this.request('/officers');
            return res ? res.data : [];
        },

        async assignOfficer(code, incidentCode, note) {
            return await this.request(`/officers/${code}/assign`, {
                method: 'POST',
                body: JSON.stringify({ incident_code: incidentCode, note })
            });
        },

        // --- Districts & Infrastructure ---
        async getDistricts() {
            const res = await this.request('/districts');
            if (res && res.data) return res.data;
            return window.MapEngine ? window.MapEngine.DISTRICT_DATA : [];
        },

        async getInfrastructure(type = 'ALL') {
            const res = await this.request(`/infrastructure?type=${type}`);
            return res ? res.data : [];
        },

        async updateInfrastructureCondition(code, condition, riskPct) {
            return await this.request(`/infrastructure/${code}/condition`, {
                method: 'POST',
                body: JSON.stringify({ condition, risk_pct: riskPct })
            });
        },

        // --- Reports ---
        async getReports(filters = {}) {
            let qs = [];
            if (filters.district) qs.push(`district=${encodeURIComponent(filters.district)}`);
            if (filters.severity) qs.push(`severity=${encodeURIComponent(filters.severity)}`);
            if (filters.status) qs.push(`status=${encodeURIComponent(filters.status)}`);
            if (filters.search) qs.push(`search=${encodeURIComponent(filters.search)}`);
            const url = `/reports${qs.length ? '?' + qs.join('&') : ''}`;
            const res = await this.request(url);
            return res ? res.data : [];
        },

        // --- AI Services ---
        async predictRouteRisk(source, destination, vehicleType, priority) {
            return await this.request('/ai/predict-route', {
                method: 'POST',
                body: JSON.stringify({
                    source,
                    destination,
                    vehicle_type: vehicleType,
                    priority
                })
            });
        },

        async analyzeDamagePhoto(filename, metadata = {}) {
            return await this.request('/ai/analyze-photo', {
                method: 'POST',
                body: JSON.stringify({ filename, metadata })
            });
        },

        async askAI(query) {
            return await this.request('/ai/command', {
                method: 'POST',
                body: JSON.stringify({ query })
            });
        },

        // --- Simulation ---
        async getSimulationPhases() {
            const res = await this.request('/simulation/phases');
            return res ? res.data : [];
        },

        async triggerSimulationPhase(num) {
            return await this.request(`/simulation/phase/${num}`, { method: 'POST' });
        },

        async resetSimulation() {
            return await this.request('/simulation/reset', { method: 'POST' });
        }
    };

    window.SmartRouteAPI = SmartRouteAPI;
    window.API = SmartRouteAPI;

    // Check backend health automatically on page load
    document.addEventListener('DOMContentLoaded', () => {
        SmartRouteAPI.checkHealth();
    });
})();
