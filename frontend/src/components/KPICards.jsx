import React from 'react';

export default function KPICards({ state }) {
  const totalPassed = state?.total_vehicles_passed ?? 0;
  const avgWait = state?.average_waiting_time ?? 0.0;
  const maxQueue = state?.max_queue_length ?? 0;
  const tickCount = state?.tick_count ?? 0;
  const phaseDuration = state?.phase_duration ?? 0;
  const currentPhase = state?.current_phase ?? 'NS';

  return (
    <section className="kpi-grid">
      {/* 1. Total Vehicles Passed */}
      <div className="kpi-card glass-panel">
        <div className="kpi-header">
          <span className="kpi-title">Total Vehicles Cleared</span>
          <span className="kpi-icon">🚗</span>
        </div>
        <div className="kpi-value-container">
          <span className="kpi-value font-mono text-cyan">{totalPassed.toLocaleString()}</span>
          <span className="kpi-unit">vehicles</span>
        </div>
        <div className="kpi-subtext">Cumulative intersection throughput</div>
      </div>

      {/* 2. Average Waiting-Time Estimate */}
      <div className="kpi-card glass-panel">
        <div className="kpi-header">
          <span className="kpi-title">Avg Waiting Time</span>
          <span className="kpi-icon">⏱️</span>
        </div>
        <div className="kpi-value-container">
          <span className="kpi-value font-mono text-amber">{avgWait.toFixed(2)}</span>
          <span className="kpi-unit">ticks / veh</span>
        </div>
        <div className="kpi-subtext">Queue delay per vehicle passed</div>
      </div>

      {/* 3. Longest Queue Observed */}
      <div className="kpi-card glass-panel">
        <div className="kpi-header">
          <span className="kpi-title">Longest Observed Queue</span>
          <span className="kpi-icon">📈</span>
        </div>
        <div className="kpi-value-container">
          <span className="kpi-value font-mono text-purple">{maxQueue}</span>
          <span className="kpi-unit">peak cars</span>
        </div>
        <div className="kpi-subtext">Maximum congestion reached</div>
      </div>

      {/* 4. Simulation Tick Count */}
      <div className="kpi-card glass-panel">
        <div className="kpi-header">
          <span className="kpi-title">Simulation Progress</span>
          <span className="kpi-icon">⏱️</span>
        </div>
        <div className="kpi-value-container">
          <span className="kpi-value font-mono text-green">Tick #{tickCount}</span>
        </div>
        <div className="kpi-subtext">
          Active phase <strong className="font-mono">{currentPhase}</strong> for {phaseDuration} {phaseDuration === 1 ? 'tick' : 'ticks'}
        </div>
      </div>
    </section>
  );
}
