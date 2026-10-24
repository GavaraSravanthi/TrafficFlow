import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export default function MetricsCharts({ history = [], currentState }) {
  const currentQueues = currentState?.queues || { north: 0, south: 0, east: 0, west: 0 };
  const totalPassed = currentState?.total_vehicles_passed ?? 0;
  const cumWait = currentState?.cumulative_waiting_time ?? 0;
  const avgWait = currentState?.average_waiting_time ?? 0.0;
  const peakQueue = currentState?.max_queue_length ?? 0;

  const currentTotalQueue =
    currentQueues.north + currentQueues.south + currentQueues.east + currentQueues.west;
  const nsQueue = currentQueues.north + currentQueues.south;
  const ewQueue = currentQueues.east + currentQueues.west;

  // Comparison bar data
  const comparisonData = [
    { name: 'NS Queue', count: nsQueue, color: '#38bdf8' },
    { name: 'EW Queue', count: ewQueue, color: '#f59e0b' },
    { name: 'Active Queue', count: currentTotalQueue, color: '#ec4899' },
    { name: 'Peak Queue', count: peakQueue, color: '#a855f7' },
  ];

  return (
    <div className="metrics-charts-container">
      {/* 1. Real-Time Queue Length Trends */}
      <div className="chart-card glass-panel">
        <div className="card-header">
          <div>
            <h3 className="card-title">Approach Queue Length Trends</h3>
            <span className="card-subtitle">Real-time queue tracking per simulation tick</span>
          </div>
          <span className="card-badge font-mono">
            {history.length > 0 ? `${history.length} ticks recorded` : 'Awaiting ticks'}
          </span>
        </div>

        <div className="chart-wrapper">
          {history.length === 0 ? (
            <div className="empty-chart font-mono">
              <span>Simulation at tick 0. Run or step the simulation to plot queue trends.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="tick"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: 'Tick', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                  label={{ value: 'Vehicles', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0e1526',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="north"
                  name="North"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="south"
                  name="South"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="east"
                  name="East"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="west"
                  name="West"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Metrics & Queue Comparison Section */}
      <div className="comparison-card glass-panel">
        <div className="card-header">
          <div>
            <h3 className="card-title">Live Congestion Comparison</h3>
            <span className="card-subtitle">Active approach distribution & efficiency metrics</span>
          </div>
          <span className="card-tag font-mono">ANALYTICS</span>
        </div>

        <div className="comparison-content">
          {/* Quick Metrics Breakdown */}
          <div className="metric-breakdown-grid font-mono">
            <div className="breakdown-stat">
              <span className="stat-label">NS Corridor</span>
              <span className="stat-val text-cyan">{nsQueue} veh</span>
            </div>
            <div className="breakdown-stat">
              <span className="stat-label">EW Corridor</span>
              <span className="stat-val text-amber">{ewQueue} veh</span>
            </div>
            <div className="breakdown-stat">
              <span className="stat-label">Cumulative Delay</span>
              <span className="stat-val text-purple">{cumWait} ticks</span>
            </div>
            <div className="breakdown-stat">
              <span className="stat-label">Throughput / Delay</span>
              <span className="stat-val text-green">
                {totalPassed > 0 ? (totalPassed / (cumWait || 1)).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Bar Comparison Chart */}
          <div className="bar-wrapper">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0e1526',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
