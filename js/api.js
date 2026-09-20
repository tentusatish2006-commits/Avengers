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

        async request(endpoint, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

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
                    badge.title = 'Connected to SmartRoute backend';
                } else {
                    badge.innerHTML = '<span style="color:#aaa;">○</span> STANDALONE';
                    badge.className = 'badge';
                    badge.title = 'Offline mode (Fallback data active)';
                }
            }
        },

        async checkHealth() {
            const res = await this.request('/health');
            return res && res.status === 'healthy';
        },

        async getRoads() {
            const res = await this.request('/roads');
            if (res && res.data) return res.data;
            return window.MapEngine ? window.MapEngine.ROAD_DATA : [];
        },

        async getIncidents() {
            const res = await this.request('/incidents');
            if (res && res.data) return res.data;
            return [];
        },

        async getVehicles() {
            const res = await this.request('/vehicles');
            if (res && res.data) return res.data;
            return window.MapEngine ? window.MapEngine.VEHICLE_DATA : [];
        },

        async getDeliveries() {
            const res = await this.request('/deliveries');
            return res ? res.data : [];
        },

        async getOfficers() {
            const res = await this.request('/officers');
            return res ? res.data : [];
        },

        async getDistricts() {
            const res = await this.request('/districts');
            if (res && res.data) return res.data;
            return window.MapEngine ? window.MapEngine.DISTRICT_DATA : [];
        },

        async getRouteDirections(start, end, options = {}) {
            const body = {
                start: Array.isArray(start) ? { lat: start[0], lng: start[1] } : start,
                end: Array.isArray(end) ? { lat: end[0], lng: end[1] } : end,
                alternatives: !!(options && options.alternatives),
                alternative_count: (options && options.alternative_count) || 2,
                profile: (options && options.profile) || 'driving-car'
            };
            const res = await this.request('/routing/directions', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            return res;
        },

        async predictRouteRisk(source, destination, vehicle_type, priority) {
            const res = await this.request('/ai/predict-route', {
                method: 'POST',
                body: JSON.stringify({ source, destination, vehicle_type, priority })
            });
            return res;
        }
    };

    window.SmartRouteAPI = SmartRouteAPI;
})();
