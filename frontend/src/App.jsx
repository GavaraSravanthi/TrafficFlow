import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import Intersection from './components/Intersection';
import Controls from './components/Controls';
import StrategyPanel from './components/StrategyPanel';
import TrafficPanel from './components/TrafficPanel';
import MetricsCharts from './components/MetricsCharts';
import { trafficApi } from './api/trafficApi';
import './App.css';

export default function App() {
  const [simulationState, setSimulationState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(1000);
  const [history, setHistory] = useState([]);

  const isSteppingRef = useRef(false);
  const timerRef = useRef(null);

  // Sync state and append to chart history
  const handleStateUpdate = useCallback((state) => {
    if (!state) return;
    setSimulationState(state);
    setIsRunning(Boolean(state.is_running));

    if (state.tick_count !== undefined) {
      setHistory((prev) => {
        // Prevent duplicate ticks in history
        if (prev.length > 0 && prev[prev.length - 1].tick === state.tick_count) {
          return prev;
        }
        const newEntry = {
          tick: state.tick_count,
          north: state.queues?.north ?? 0,
          south: state.queues?.south ?? 0,
          east: state.queues?.east ?? 0,
          west: state.queues?.west ?? 0,
          totalPassed: state.total_vehicles_passed ?? 0,
          avgWait: state.average_waiting_time ?? 0,
        };
        // Keep last 40 data points for performance and readability
        return [...prev.slice(-39), newEntry];
      });
    }
  }, []);

  // Fetch current state from backend
  const fetchState = useCallback(async () => {
    try {
      const state = await trafficApi.getState();
      setIsConnected(true);
      setConnectionError('');
      handleStateUpdate(state);
    } catch (err) {
      setIsConnected(false);
      setConnectionError(err.message);
    }
  }, [handleStateUpdate]);

  // Initial load: check health and fetch state
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Health poll check every 5 seconds (without advancing simulation)
  useEffect(() => {
    const healthInterval = setInterval(async () => {
      try {
        await trafficApi.checkHealth();
        setIsConnected(true);
        setConnectionError('');
      } catch (err) {
        setIsConnected(false);
        setConnectionError(err.message);
      }
    }, 5000);
    return () => clearInterval(healthInterval);
  }, []);

  // Execution loop: Advances ticks at controlled interval when isRunning is true
  useEffect(() => {
    if (!isRunning || !isConnected) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(async () => {
      // Prevent overlapping step calls
      if (isSteppingRef.current) return;
      try {
        isSteppingRef.current = true;
        const updated = await trafficApi.step();
        handleStateUpdate(updated);
      } catch (err) {
        console.error('Tick execution failed:', err);
        setIsConnected(false);
        setConnectionError(err.message);
        setIsRunning(false);
      } finally {
        isSteppingRef.current = false;
      }
    }, speedMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, isConnected, speedMs, handleStateUpdate]);

  // Control Handlers
  const handleStart = async () => {
    try {
      const updated = await trafficApi.start();
      handleStateUpdate(updated);
      setIsRunning(true);
    } catch (err) {
      alert(`Failed to start simulation: ${err.message}`);
    }
  };

  const handlePause = async () => {
    try {
      const updated = await trafficApi.pause();
      handleStateUpdate(updated);
      setIsRunning(false);
    } catch (err) {
      alert(`Failed to pause simulation: ${err.message}`);
    }
  };

  const handleReset = async () => {
    try {
      const updated = await trafficApi.reset();
      handleStateUpdate(updated);
      setIsRunning(false);
      setHistory([]);
    } catch (err) {
      alert(`Failed to reset simulation: ${err.message}`);
    }
  };

  const handleManualStep = async () => {
    if (isSteppingRef.current) return;
    try {
      isSteppingRef.current = true;
      const updated = await trafficApi.stepOnce(isRunning);
      handleStateUpdate(updated);
    } catch (err) {
      alert(`Step failed: ${err.message}`);
    } finally {
      isSteppingRef.current = false;
    }
  };

  const handleApplyStrategy = async (strategyConfig) => {
    const updated = await trafficApi.updateStrategy(strategyConfig);
    handleStateUpdate(updated);
  };

  const handleApplyTraffic = async (rates) => {
    const updated = await trafficApi.updateTraffic(rates);
    handleStateUpdate(updated);
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        isConnected={isConnected}
        isRunning={isRunning}
        currentPhase={simulationState?.current_phase}
        strategy={simulationState?.strategy}
        apiUrl={trafficApi.getBaseUrl()}
      />

      {/* Backend Disconnection Banner */}
      {!isConnected && (
        <div className="connection-alert font-mono">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <div className="alert-text">
              <strong>Backend Disconnected:</strong> {connectionError || 'Unable to connect to FastAPI.'}
              <div className="alert-instruction">
                Make sure the backend is running in PowerShell: <code>cd backend; python -m uvicorn app.main:app --reload --port 8000</code>
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-retry" onClick={fetchState}>
            Retry Connection
          </button>
        </div>
      )}

      {/* Main KPI Row */}
      <KPICards state={simulationState} />

      {/* Primary Dashboard Grid */}
      <main className="dashboard-grid">
        {/* Left Column: Intersection Canvas & Live Controls */}
        <div className="dashboard-col col-primary">
          <Intersection state={simulationState} isRunning={isRunning} />
          <Controls
            isRunning={isRunning}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            onStep={handleManualStep}
            speedMs={speedMs}
            onSpeedChange={setSpeedMs}
            disabled={!isConnected}
          />
        </div>

        {/* Right Column: Settings & Analytical Charts */}
        <div className="dashboard-col col-secondary">
          <StrategyPanel
            currentStrategy={simulationState?.strategy}
            strategyConfig={simulationState?.strategy_config}
            onApplyStrategy={handleApplyStrategy}
            disabled={!isConnected}
          />
          <TrafficPanel
            currentRates={simulationState?.arrival_rates}
            onApplyTraffic={handleApplyTraffic}
            disabled={!isConnected}
          />
        </div>
      </main>

      {/* Bottom Section: Recharts Metrics Trends & Congestion Comparison */}
      <section className="metrics-section">
        <MetricsCharts history={history} currentState={simulationState} />
      </section>

      {/* Footer */}
      <footer className="footer font-mono">
        <span>TrafficFlow DevOps Lab • Milestone 2 • FastAPI + React + Vite</span>
      </footer>
    </div>
  );
}
