/**
 * TrafficFlow API Client
 * Interfaces with the FastAPI backend using Fetch API.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorDetail = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Response was not JSON
      }
      throw new Error(errorDetail);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Is FastAPI running?`);
    }
    throw err;
  }
}

export const trafficApi = {
  getBaseUrl() {
    return API_BASE_URL;
  },

  async checkHealth() {
    return request('/api/health');
  },

  async getState() {
    return request('/api/simulation/state');
  },

  async start() {
    return request('/api/simulation/start', { method: 'POST' });
  },

  async pause() {
    return request('/api/simulation/pause', { method: 'POST' });
  },

  async reset() {
    return request('/api/simulation/reset', { method: 'POST' });
  },

  async step() {
    return request('/api/simulation/step', { method: 'POST' });
  },

  /**
   * Helper to advance exactly one tick even when paused:
   * Backend /step requires is_running=True to advance. If paused, we briefly
   * start, step, and pause, returning the new state.
   */
  async stepOnce(isCurrentlyRunning) {
    if (isCurrentlyRunning) {
      return request('/api/simulation/step', { method: 'POST' });
    }
    await request('/api/simulation/start', { method: 'POST' });
    const stepped = await request('/api/simulation/step', { method: 'POST' });
    await request('/api/simulation/pause', { method: 'POST' });
    return { ...stepped, is_running: false };
  },

  async updateStrategy({ strategy, fixed_duration, min_green, max_green }) {
    const payload = { strategy };
    if (fixed_duration !== undefined && fixed_duration !== null) {
      payload.fixed_duration = Number(fixed_duration);
    }
    if (min_green !== undefined && min_green !== null) {
      payload.min_green = Number(min_green);
    }
    if (max_green !== undefined && max_green !== null) {
      payload.max_green = Number(max_green);
    }
    return request('/api/simulation/strategy', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateTraffic({ north, south, east, west }) {
    const payload = {
      north: Number(north),
      south: Number(south),
      east: Number(east),
      west: Number(west),
    };
    return request('/api/simulation/traffic', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
