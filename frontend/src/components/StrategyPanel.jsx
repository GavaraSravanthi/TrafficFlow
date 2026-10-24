import React, { useState, useEffect } from 'react';

export default function StrategyPanel({ currentStrategy, strategyConfig, onApplyStrategy, disabled }) {
  const [selectedStrategy, setSelectedStrategy] = useState(currentStrategy || 'fixed');
  const [fixedDuration, setFixedDuration] = useState(strategyConfig?.fixed_duration ?? 5);
  const [minGreen, setMinGreen] = useState(strategyConfig?.min_green ?? 3);
  const [maxGreen, setMaxGreen] = useState(strategyConfig?.max_green ?? 10);
  const [validationError, setValidationError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (currentStrategy) setSelectedStrategy(currentStrategy);
  }, [currentStrategy]);

  useEffect(() => {
    if (strategyConfig) {
      if (strategyConfig.fixed_duration) setFixedDuration(strategyConfig.fixed_duration);
      if (strategyConfig.min_green) setMinGreen(strategyConfig.min_green);
      if (strategyConfig.max_green) setMaxGreen(strategyConfig.max_green);
    }
  }, [strategyConfig]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (selectedStrategy === 'fixed') {
      if (!fixedDuration || fixedDuration < 1) {
        setValidationError('Fixed duration must be at least 1 tick.');
        return;
      }
    } else if (selectedStrategy === 'adaptive') {
      if (!minGreen || minGreen < 1) {
        setValidationError('Minimum green must be at least 1 tick.');
        return;
      }
      if (!maxGreen || maxGreen < 1) {
        setValidationError('Maximum green must be at least 1 tick.');
        return;
      }
      if (Number(maxGreen) < Number(minGreen)) {
        setValidationError('Maximum green duration must be greater than or equal to minimum green.');
        return;
      }
    }

    try {
      setIsApplying(true);
      await onApplyStrategy({
        strategy: selectedStrategy,
        fixed_duration: selectedStrategy === 'fixed' ? Number(fixedDuration) : undefined,
        min_green: selectedStrategy === 'adaptive' ? Number(minGreen) : undefined,
        max_green: selectedStrategy === 'adaptive' ? Number(maxGreen) : undefined,
      });
    } catch (err) {
      setValidationError(err.message || 'Failed to update strategy.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="strategy-panel glass-panel">
      <div className="card-header">
        <h3 className="card-title">Traffic Signal Strategy</h3>
        <span className="card-tag font-mono">BACKEND API COMPLIANT</span>
      </div>

      <form onSubmit={handleSubmit} className="strategy-form">
        {/* Strategy Mode Switcher */}
        <div className="strategy-toggle-group">
          <button
            type="button"
            className={`strategy-toggle-btn ${selectedStrategy === 'fixed' ? 'active fixed' : ''}`}
            onClick={() => setSelectedStrategy('fixed')}
            disabled={disabled}
          >
            <span className="toggle-title">Fixed-Time</span>
            <span className="toggle-desc">Alternates at fixed tick intervals</span>
          </button>

          <button
            type="button"
            className={`strategy-toggle-btn ${selectedStrategy === 'adaptive' ? 'active adaptive' : ''}`}
            onClick={() => setSelectedStrategy('adaptive')}
            disabled={disabled}
          >
            <span className="toggle-title">Adaptive Smart Flow</span>
            <span className="toggle-desc">Prioritizes larger queue with fair limits</span>
          </button>
        </div>

        {/* Dynamic Inputs Based on Strategy */}
        {selectedStrategy === 'fixed' ? (
          <div className="strategy-fields">
            <div className="input-group">
              <label htmlFor="fixedDuration" className="input-label">
                Fixed Green Duration (ticks):
              </label>
              <input
                id="fixedDuration"
                type="number"
                min="1"
                max="50"
                value={fixedDuration}
                onChange={(e) => setFixedDuration(e.target.value)}
                className="control-input font-mono"
                disabled={disabled}
                required
              />
              <span className="input-hint">Ticks before alternating between NS and EW</span>
            </div>
          </div>
        ) : (
          <div className="strategy-fields-grid">
            <div className="input-group">
              <label htmlFor="minGreen" className="input-label">
                Min Green (ticks):
              </label>
              <input
                id="minGreen"
                type="number"
                min="1"
                max="30"
                value={minGreen}
                onChange={(e) => setMinGreen(e.target.value)}
                className="control-input font-mono"
                disabled={disabled}
                required
              />
              <span className="input-hint">Guaranteed minimum green phase</span>
            </div>

            <div className="input-group">
              <label htmlFor="maxGreen" className="input-label">
                Max Green (ticks):
              </label>
              <input
                id="maxGreen"
                type="number"
                min="1"
                max="50"
                value={maxGreen}
                onChange={(e) => setMaxGreen(e.target.value)}
                className="control-input font-mono"
                disabled={disabled}
                required
              />
              <span className="input-hint">Maximum limit (prevents starvation)</span>
            </div>
          </div>
        )}

        {validationError && (
          <div className="error-banner font-mono">
            ⚠️ {validationError}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-accent btn-apply"
          disabled={disabled || isApplying}
        >
          {isApplying ? 'Applying Strategy...' : 'Apply Signal Strategy'}
        </button>
      </form>
    </div>
  );
}
