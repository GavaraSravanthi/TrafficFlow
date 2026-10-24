import React from 'react';

export default function Controls({
  isRunning,
  onStart,
  onPause,
  onReset,
  onStep,
  speedMs,
  onSpeedChange,
  disabled,
}) {
  return (
    <div className="control-card glass-panel">
      <div className="card-header">
        <h3 className="card-title">Simulation Engine Controls</h3>
        <span className="card-badge font-mono">
          {isRunning ? '● RUNNING' : '⏸ PAUSED'}
        </span>
      </div>

      <div className="control-actions-grid">
        {/* Run / Pause toggle */}
        {!isRunning ? (
          <button
            className="btn btn-primary btn-run"
            onClick={onStart}
            disabled={disabled}
            title="Start continuous simulation ticks"
          >
            <span className="btn-icon">▶</span>
            <span>Run Simulation</span>
          </button>
        ) : (
          <button
            className="btn btn-warning btn-pause"
            onClick={onPause}
            disabled={disabled}
            title="Pause simulation ticks"
          >
            <span className="btn-icon">⏸</span>
            <span>Pause Simulation</span>
          </button>
        )}

        {/* Manual Step */}
        <button
          className="btn btn-secondary btn-step"
          onClick={onStep}
          disabled={disabled || isRunning}
          title={isRunning ? 'Simulation is already auto-advancing' : 'Advance by exactly 1 tick'}
        >
          <span className="btn-icon">⏭</span>
          <span>Step (1 Tick)</span>
        </button>

        {/* Reset */}
        <button
          className="btn btn-danger btn-reset"
          onClick={onReset}
          disabled={disabled}
          title="Reset all queues, tick counters, and metrics back to zero"
        >
          <span className="btn-icon">↺</span>
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Speed Selector */}
      <div className="speed-control-container">
        <span className="speed-label font-mono">TICK RATE:</span>
        <div className="speed-pills">
          {[
            { label: '0.5x (2.0s)', ms: 2000 },
            { label: '1.0x (1.0s)', ms: 1000 },
            { label: '2.0x (0.5s)', ms: 500 },
          ].map((item) => (
            <button
              key={item.ms}
              className={`speed-pill ${speedMs === item.ms ? 'active' : ''}`}
              onClick={() => onSpeedChange(item.ms)}
              disabled={disabled}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
