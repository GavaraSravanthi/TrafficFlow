import React from 'react';

export default function Header({ isConnected, isRunning, currentPhase, strategy, apiUrl }) {
  return (
    <header className="header glass-panel">
      <div className="header-left">
        <div className="logo-badge">
          <span className="logo-icon">🚦</span>
          <div className="logo-title-group">
            <h1 className="logo-title">TrafficFlow</h1>
            <span className="logo-subtitle">Smart Traffic Simulation • City Control Room</span>
          </div>
        </div>
      </div>

      <div className="header-badges">
        {/* Phase Badge */}
        <div className={`status-pill phase-${currentPhase?.toLowerCase()}`}>
          <span className="pill-dot"></span>
          <span className="pill-label">Phase:</span>
          <span className="pill-value font-mono">{currentPhase || 'NS'}</span>
        </div>

        {/* Strategy Badge */}
        <div className={`status-pill strategy-${strategy}`}>
          <span className="pill-dot"></span>
          <span className="pill-label">Strategy:</span>
          <span className="pill-value font-mono">{strategy?.toUpperCase() || 'FIXED'}</span>
        </div>

        {/* Running / Paused Badge */}
        <div className={`status-pill ${isRunning ? 'running-active' : 'paused-active'}`}>
          <span className="pill-dot pulse"></span>
          <span className="pill-value font-mono">{isRunning ? 'RUNNING' : 'PAUSED'}</span>
        </div>

        {/* Backend Connection Badge */}
        <div
          className={`status-pill ${isConnected ? 'conn-connected' : 'conn-disconnected'}`}
          title={`Backend URL: ${apiUrl}`}
        >
          <span className="pill-dot pulse"></span>
          <span className="pill-value font-mono">
            {isConnected ? 'API ONLINE' : 'API OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
}
