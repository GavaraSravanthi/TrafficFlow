import React from 'react';

// Vehicle icon component with customizable color and heading
function VehicleIcon({ color = '#00f0ff', rotation = 0, isMoving = false }) {
  return (
    <div
      className={`vehicle-car ${isMoving ? 'vehicle-moving' : ''}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Car chassis */}
        <rect x="2" y="4" width="20" height="32" rx="5" fill={color} stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" />
        {/* Windshield */}
        <path d="M5 12H19L17 18H7L5 12Z" fill="#0b1324" opacity="0.8" />
        {/* Rear window */}
        <path d="M6 30H18L16.5 27H7.5L6 30Z" fill="#0b1324" opacity="0.8" />
        {/* Roof */}
        <rect x="7" y="19" width="10" height="7" rx="1.5" fill="#060b17" opacity="0.4" />
        {/* Front Headlights */}
        <circle cx="5" cy="5" r="1.5" fill="#ffffff" />
        <circle cx="19" cy="5" r="1.5" fill="#ffffff" />
        {/* Taillights */}
        <circle cx="5" cy="35" r="1.5" fill="#ef4444" />
        <circle cx="19" cy="35" r="1.5" fill="#ef4444" />
      </svg>
    </div>
  );
}

// Traffic Light Component
function TrafficLight({ state = 'red', label = '' }) {
  const isGreen = state === 'green';
  return (
    <div className={`traffic-light-housing ${state}`} title={`${label}: ${state.toUpperCase()}`}>
      <div className={`light-lamp red ${!isGreen ? 'active' : ''}`} />
      <div className={`light-lamp green ${isGreen ? 'active' : ''}`} />
      <span className="light-label">{label}</span>
    </div>
  );
}

export default function Intersection({ state, isRunning }) {
  const queues = state?.queues || { north: 0, south: 0, east: 0, west: 0 };
  const trafficState = state?.traffic_state || {
    north: 'green',
    south: 'green',
    east: 'red',
    west: 'red',
  };

  const carColors = ['#00f0ff', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#38bdf8'];

  // Helper to render vehicle queue icons for an approach
  const renderQueue = (count, rotation, approachName) => {
    const visibleCount = Math.min(count, 5);
    const overflow = count - visibleCount;

    return (
      <div className={`queue-cars queue-${approachName}`}>
        {Array.from({ length: visibleCount }).map((_, idx) => (
          <VehicleIcon
            key={`${approachName}-${idx}`}
            color={carColors[(idx + count) % carColors.length]}
            rotation={rotation}
          />
        ))}
        {overflow > 0 && (
          <div className="queue-overflow font-mono">+{overflow}</div>
        )}
      </div>
    );
  };

  const isNSGreen = trafficState.north === 'green';
  const isEWGreen = trafficState.east === 'green';

  return (
    <div className="intersection-container glass-panel">
      <div className="intersection-header">
        <h2 className="intersection-title">Intersection Real-Time View</h2>
        <div className="intersection-legend">
          <span className="legend-item"><span className="legend-box green"></span> Active Green (Flowing)</span>
          <span className="legend-item"><span className="legend-box red"></span> Stopped Red (Queued)</span>
        </div>
      </div>

      <div className="intersection-canvas">
        {/* NORTH ROAD */}
        <div className="road road-north">
          <div className="approach-badge north font-mono">
            <span>NORTH</span>
            <strong>{queues.north} in queue</strong>
          </div>
          <div className="lane lane-incoming">
            {renderQueue(queues.north, 180, 'north')}
          </div>
          <div className="road-divider-vertical" />
          <div className="lane lane-outgoing">
            {isNSGreen && isRunning && (
              <div className="transit-vehicle north-to-south">
                <VehicleIcon color="#38bdf8" rotation={0} isMoving={true} />
              </div>
            )}
          </div>
          <div className="crosswalk crosswalk-north" />
          <div className="light-wrapper light-north">
            <TrafficLight state={trafficState.north} label="NORTH" />
          </div>
        </div>

        {/* SOUTH ROAD */}
        <div className="road road-south">
          <div className="light-wrapper light-south">
            <TrafficLight state={trafficState.south} label="SOUTH" />
          </div>
          <div className="crosswalk crosswalk-south" />
          <div className="lane lane-outgoing">
            {isNSGreen && isRunning && (
              <div className="transit-vehicle south-to-north">
                <VehicleIcon color="#10b981" rotation={180} isMoving={true} />
              </div>
            )}
          </div>
          <div className="road-divider-vertical" />
          <div className="lane lane-incoming">
            {renderQueue(queues.south, 0, 'south')}
          </div>
          <div className="approach-badge south font-mono">
            <span>SOUTH</span>
            <strong>{queues.south} in queue</strong>
          </div>
        </div>

        {/* WEST ROAD */}
        <div className="road road-west">
          <div className="approach-badge west font-mono">
            <span>WEST</span>
            <strong>{queues.west} in queue</strong>
          </div>
          <div className="lane lane-incoming">
            {renderQueue(queues.west, 90, 'west')}
          </div>
          <div className="road-divider-horizontal" />
          <div className="lane lane-outgoing">
            {isEWGreen && isRunning && (
              <div className="transit-vehicle east-to-west">
                <VehicleIcon color="#a855f7" rotation={270} isMoving={true} />
              </div>
            )}
          </div>
          <div className="crosswalk crosswalk-west" />
          <div className="light-wrapper light-west">
            <TrafficLight state={trafficState.west} label="WEST" />
          </div>
        </div>

        {/* EAST ROAD */}
        <div className="road road-east">
          <div className="light-wrapper light-east">
            <TrafficLight state={trafficState.east} label="EAST" />
          </div>
          <div className="crosswalk crosswalk-east" />
          <div className="lane lane-outgoing">
            {isEWGreen && isRunning && (
              <div className="transit-vehicle west-to-east">
                <VehicleIcon color="#f59e0b" rotation={90} isMoving={true} />
              </div>
            )}
          </div>
          <div className="road-divider-horizontal" />
          <div className="lane lane-incoming">
            {renderQueue(queues.east, 270, 'east')}
          </div>
          <div className="approach-badge east font-mono">
            <span>EAST</span>
            <strong>{queues.east} in queue</strong>
          </div>
        </div>

        {/* INTERSECTION CENTER BOX */}
        <div className="intersection-center">
          <div className="center-grid-box">
            <div className={`flow-indicator ns ${isNSGreen ? 'active' : ''}`}>
              <span>▲</span>
              <span>▼</span>
            </div>
            <div className={`flow-indicator ew ${isEWGreen ? 'active' : ''}`}>
              <span>◀</span>
              <span>▶</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
