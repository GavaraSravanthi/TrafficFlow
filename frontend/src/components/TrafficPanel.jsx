import React, { useState, useEffect } from 'react';

export default function TrafficPanel({ currentRates, onApplyTraffic, disabled }) {
  const [rates, setRates] = useState({
    north: currentRates?.north ?? 1,
    south: currentRates?.south ?? 1,
    east: currentRates?.east ?? 1,
    west: currentRates?.west ?? 1,
  });
  const [isApplying, setIsApplying] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentRates) {
      setRates({
        north: currentRates.north ?? 1,
        south: currentRates.south ?? 1,
        east: currentRates.east ?? 1,
        west: currentRates.west ?? 1,
      });
    }
  }, [currentRates]);

  const handleChange = (approach, val) => {
    const num = Math.max(0, Math.min(5, parseInt(val, 10) || 0));
    setRates((prev) => ({ ...prev, [approach]: num }));
  };

  const handlePreset = (type) => {
    if (type === 'balanced') {
      setRates({ north: 2, south: 2, east: 2, west: 2 });
    } else if (type === 'ns_rush') {
      setRates({ north: 5, south: 5, east: 1, west: 0 });
    } else if (type === 'ew_rush') {
      setRates({ north: 0, south: 1, east: 5, west: 5 });
    } else if (type === 'quiet') {
      setRates({ north: 0, south: 0, east: 0, west: 0 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      setIsApplying(true);
      await onApplyTraffic(rates);
      setMessage('Traffic rates updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const approaches = [
    { key: 'north', label: 'North Approach', color: '#38bdf8' },
    { key: 'south', label: 'South Approach', color: '#10b981' },
    { key: 'east', label: 'East Approach', color: '#f59e0b' },
    { key: 'west', label: 'West Approach', color: '#a855f7' },
  ];

  return (
    <div className="traffic-panel glass-panel">
      <div className="card-header">
        <h3 className="card-title">Vehicle Arrival Rates</h3>
        <span className="card-tag font-mono">0 - 5 VEHICLES / TICK</span>
      </div>

      <form onSubmit={handleSubmit} className="traffic-form">
        <div className="traffic-sliders-grid">
          {approaches.map(({ key, label, color }) => (
            <div key={key} className="slider-group">
              <div className="slider-header">
                <span className="slider-label" style={{ borderLeft: `3px solid ${color}`, paddingLeft: '8px' }}>
                  {label}
                </span>
                <span className="slider-value font-mono">
                  {rates[key]} <small>cars/tick</small>
                </span>
              </div>
              <div className="slider-track-container">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={rates[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="traffic-slider"
                  disabled={disabled}
                />
              </div>
              <div className="slider-ticks font-mono">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Presets */}
        <div className="preset-container">
          <span className="preset-label font-mono">PRESETS:</span>
          <div className="preset-buttons">
            <button
              type="button"
              className="preset-btn"
              onClick={() => handlePreset('balanced')}
              disabled={disabled}
            >
              Balanced (2/tick)
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handlePreset('ns_rush')}
              disabled={disabled}
            >
              NS Heavy Rush
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handlePreset('ew_rush')}
              disabled={disabled}
            >
              EW Heavy Rush
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handlePreset('quiet')}
              disabled={disabled}
            >
              Quiet Zero
            </button>
          </div>
        </div>

        {message && (
          <div className={`status-banner font-mono ${message.startsWith('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-accent btn-apply"
          disabled={disabled || isApplying}
        >
          {isApplying ? 'Applying Rates...' : 'Apply Traffic Settings'}
        </button>
      </form>
    </div>
  );
}
