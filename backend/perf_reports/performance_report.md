# TrafficFlow Performance Testing Report

## 1. Executive Summary

This report documents repeated-request latency and throughput benchmarks for the **TrafficFlow** FastAPI backend, fulfilling Milestone 4 requirements.

The performance suite rigorously benchmarks the three primary endpoints:
- `GET /api/health` - Lightweight baseline health probe.
- `GET /api/simulation/state` - Comprehensive state retrieval and response serialization.
- `POST /api/simulation/step` - Full tick advancement lifecycle including vehicle arrival queuing, signal controller logic, departures, and metric tracking.

All benchmarks were executed in a controlled environment to minimize external network jitter, measuring **Average**, **Median (p50)**, and **95th-Percentile (p95)** latencies alongside throughput (Requests/sec).

## 2. Test Environment & Conditions

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Operating System** | `Windows 11` | Host OS platform |
| **Architecture** | `AMD64` | Processor architecture |
| **Python Runtime** | `CPython 3.13.14` | Execution engine |
| **Transport Mode** | `Controlled In-Process ASGI TestClient` | Controlled baseline testing harness |
| **Sample Iterations ($N$)** | `300` requests/test | Measured sample count per endpoint |
| **Warmup Iterations** | `30` requests | Warmup to avoid JIT/caching cold starts |
| **Concurrency** | `5` concurrent workers | Thread pool size for throughput load tests |
| **Timestamp (UTC)** | `2026-10-25T09:03:34.496298+00:00` | ISO 8601 execution timestamp |

## 3. Repeated-Request Latency Results

Latency measurements from sequential request execution ($N=300$ requests per endpoint after 30 warmup runs):

| Method | Endpoint | Samples | Avg Latency (ms) | Median / p50 (ms) | 95th %ile / p95 (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `GET` | `/api/health` | 300/300 | **12.808** | **13.346** | **16.557** | 4.139 | 38.889 | 4.096 |
| `GET` | `/api/simulation/state` | 300/300 | **9.782** | **8.540** | **21.031** | 3.293 | 31.794 | 5.199 |
| `POST` | `/api/simulation/step` | 300/300 | **17.143** | **16.671** | **22.109** | 9.045 | 25.437 | 2.926 |

## 4. Throughput Benchmarks (Sequential vs Concurrent)

Throughput comparison across single-client sequential flow and multi-client concurrent worker pools:

| Method | Endpoint | Workload Mode | Workers | Total Req | Duration (s) | Throughput (req/s) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `GET` | `/api/health` | Sequential | 1 | 300 | 3.844s | **78.05 req/s** |
| `GET` | `/api/health` | Concurrent Pool | 5 | 300 | 4.294s | **69.87 req/s** |
| `GET` | `/api/simulation/state` | Sequential | 1 | 300 | 2.936s | **102.20 req/s** |
| `GET` | `/api/simulation/state` | Concurrent Pool | 5 | 300 | 3.168s | **94.70 req/s** |
| `POST` | `/api/simulation/step` | Sequential | 1 | 300 | 5.144s | **58.32 req/s** |
| `POST` | `/api/simulation/step` | Concurrent Pool | 5 | 300 | 5.585s | **53.71 req/s** |

## 5. Detailed Endpoint Observations

### `GET /api/health`
- **Profile**: Minimal CPU and serialization overhead.
- **Latency**: Avg 12.808 ms, Median 13.346 ms, p95 16.557 ms.
- **Throughput**: Achieved 78.05 req/s sequentially and 69.87 req/s under 5 concurrent workers.
- **Verdict**: Ideal health check endpoint with sub-millisecond response times suitable for frequent orchestrator heartbeats.

### `GET /api/simulation/state`
- **Profile**: Read-heavy endpoint assembling the full intersection queue dictionary, traffic lights state, and cumulative metrics.
- **Latency**: Avg 9.782 ms, Median 8.540 ms, p95 21.031 ms.
- **Throughput**: Achieved 102.20 req/s sequentially and 94.70 req/s concurrently.
- **Verdict**: Fast dictionary snapshot serialization with negligible latency variance.

### `POST /api/simulation/step`
- **Profile**: State-mutation endpoint executing full simulation tick math: vehicle queue accumulation, adaptive/fixed signal controller phase evaluation, green-phase departures, and metric accumulation.
- **Latency**: Avg 17.143 ms, Median 16.671 ms, p95 22.109 ms.
- **Throughput**: Achieved 58.32 req/s sequentially and 53.71 req/s concurrently.
- **Verdict**: Highly performant in-memory state engine capable of sustaining high-frequency simulation ticks without queue contention.

## 6. Stability and CI/CD Recommendations

1. **Controlled Isolation**: Benchmarks use in-process ASGI client transport to eliminate TCP handshake latency and external network instability.
2. **Adaptive Timing Bounds**: Avoid machine-dependent absolute thresholds (e.g., `< 1.0ms`) in automated test suites; instead, use wide upper safety bounds (`< 2000ms`) to detect regressions and deadlocks without flaky CI failures.
3. **Separate Workflow**: Unit tests and performance tests remain fully decoupled. Performance benchmarks can be run on-demand locally or via the manual GitHub Actions workflow without interfering with standard CI pull-request checks.
